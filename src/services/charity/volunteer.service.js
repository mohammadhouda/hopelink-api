import prisma from "../../config/prisma.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";

export async function getVolunteers(
  charityId,
  { page = 1, limit = 10, opportunityId, search } = {},
) {
  const skip = (page - 1) * limit;

  const where = {
    status: "APPROVED",
    opportunity: {
      charityId,
      ...(opportunityId && { id: opportunityId }),
    },
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  // Get all approved applications (no pagination yet)
  const applications = await prisma.opportunityApplication.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          baseProfile: {
            select: { avatarUrl: true, phone: true, city: true, country: true },
          },
          volunteerProfile: {
            select: { isVerified: true, isAvailable: true, experience: true },
          },
        },
      },
      opportunity: {
        select: { id: true, title: true, startDate: true, endDate: true },
      },
    },
  });

  // Group by userId
  const grouped = new Map();
  for (const app of applications) {
    const uid = app.user.id;
    if (!grouped.has(uid)) {
      grouped.set(uid, {
        user: app.user,
        opportunities: [],
      });
    }
    grouped.get(uid).opportunities.push({
      applicationId: app.id,
      opportunityId: app.opportunity.id,
      title: app.opportunity.title,
      startDate: app.opportunity.startDate,
      endDate: app.opportunity.endDate,
    });
  }

  const allVolunteers = Array.from(grouped.values());
  const total = allVolunteers.length;

  // Paginate after grouping
  const volunteers = allVolunteers.slice(skip, skip + limit);

  return { volunteers, total, page, limit };
}

export async function getVolunteerDetails(charityId, volunteerId) {
  // Verify this volunteer has at least one approved application with this charity
  const approvedApps = await prisma.opportunityApplication.findMany({
    where: {
      userId: volunteerId,
      status: "APPROVED",
      opportunity: { charityId },
    },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  if (!approvedApps.length)
    throw { status: 404, message: "Volunteer not found in your charity" };

  const user = await prisma.user.findUnique({
    where: { id: volunteerId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      baseProfile: {
        select: {
          avatarUrl: true,
          phone: true,
          city: true,
          country: true,
          bio: true,
        },
      },
      volunteerProfile: {
        select: {
          isVerified: true,
          isAvailable: true,
          availabilityDays: true,
          experience: true,
          skills: { select: { skill: true } },
          preferences: { select: { type: true, value: true } },
          experiences: {
            orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
          },
        },
      },
      ratingsReceived: {
        where: { charityId },
        select: {
          rating: true,
          comment: true,
          opportunityId: true,
          createdAt: true,
        },
      },
      certificates: {
        where: { charityId },
        select: { id: true, opportunityId: true, issuedAt: true },
      },
    },
  });

  return { ...user, opportunities: approvedApps.map((a) => a.opportunity) };
}

export async function removeVolunteer(charityId, volunteerId, opportunityId) {
  const application = await prisma.opportunityApplication.findFirst({
    where: {
      userId: volunteerId,
      opportunityId,
      status: "APPROVED",
      opportunity: { charityId },
    },
    include: { opportunity: { select: { title: true } } },
  });

  if (!application)
    throw { status: 404, message: "Approved application not found" };

  await prisma.$transaction(async (tx) => {
    await tx.opportunityApplication.update({
      where: { id: application.id },
      data: { status: "DECLINED" },
    });

    // Remove from the volunteer room if it exists
    const room = await tx.volunteerRoom.findUnique({
      where: { opportunityId },
    });
    if (room) {
      await tx.roomMember.deleteMany({
        where: { roomId: room.id, userId: volunteerId },
      });
    }
  });

  return {
    message: `Volunteer removed from "${application.opportunity.title}"`,
  };
}

export async function sendEmailToVolunteer(
  charityId,
  volunteerId,
  { subject, body },
) {
  // Verify this volunteer belongs to this charity
  const application = await prisma.opportunityApplication.findFirst({
    where: {
      userId: volunteerId,
      status: "APPROVED",
      opportunity: { charityId },
    },
  });

  if (!application)
    throw { status: 404, message: "Volunteer not found in your charity" };

  const [volunteer, charity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: volunteerId },
      select: { name: true, email: true },
    }),
    prisma.charityAccount.findUnique({
      where: { id: charityId },
      select: { name: true },
    }),
  ]);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;background:#f4f4f5;">
      <div style="background:#fff;border-radius:16px;padding:32px;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:0 0 8px;">Message from</p>
        <h2 style="margin:0 0 24px;color:#111827;">${charity.name}</h2>
        <p style="margin:0 0 8px;color:#374151;">Hi ${volunteer.name},</p>
        <div style="margin:16px 0;color:#374151;white-space:pre-wrap;">${body}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;margin:0;">This message was sent through Hope Link.</p>
      </div>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [volunteer.email],
    subject,
    html,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);

  return { message: `Email sent to ${volunteer.email}` };
}
