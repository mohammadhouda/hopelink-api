import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── (order matters — children before parents) ─────────────────────
  await prisma.roomMessage.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.volunteerRoom.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.volunteerRating.deleteMany();
  await prisma.opportunityApplication.deleteMany();
  await prisma.volunteeringOpportunity.deleteMany();
  await prisma.application.deleteMany();
  await prisma.charityProject.deleteMany();
  await prisma.charityAccount.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.volunteerPreference.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.baseProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.accountLockout.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.registrationRequest.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Password123!", 12);

  // USERS
  console.log("  → Users");

  const admin = await prisma.user.create({
    data: {
      name: "Sarah Mitchell",
      email: "admin@ngoplatform.com",
      password,
      role: "ADMIN",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0101",
          city: "New York",
          country: "USA",
          bio: "Platform administrator managing all NGO operations.",
          avatarUrl: "https://i.pravatar.cc/150?img=47",
        },
      },
    },
  });

  const charity1User = await prisma.user.create({
    data: {
      name: "GreenEarth Foundation",
      email: "contact@greenearth.org",
      password,
      role: "CHARITY",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0201",
          city: "San Francisco",
          country: "USA",
          avatarUrl: "https://i.pravatar.cc/150?img=12",
        },
      },
    },
  });

  const charity2User = await prisma.user.create({
    data: {
      name: "Bright Futures Education",
      email: "hello@brightfutures.org",
      password,
      role: "CHARITY",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0202",
          city: "Chicago",
          country: "USA",
          avatarUrl: "https://i.pravatar.cc/150?img=25",
        },
      },
    },
  });

  const charity3User = await prisma.user.create({
    data: {
      name: "Paws & Claws Rescue",
      email: "info@pawsandclaws.org",
      password,
      role: "CHARITY",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0203",
          city: "Austin",
          country: "USA",
          avatarUrl: "https://i.pravatar.cc/150?img=33",
        },
      },
    },
  });

  // Volunteers / regular users
  const vol1 = await prisma.user.create({
    data: {
      name: "James Carter",
      email: "james.carter@email.com",
      password,
      role: "USER",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0301",
          city: "San Francisco",
          country: "USA",
          bio: "Passionate about environmental causes and outdoor activities.",
          avatarUrl: "https://i.pravatar.cc/150?img=51",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityNote: "Weekends and Friday afternoons",
          experience: "3 years of community volunteering",
          isVerified: true,
          skills: {
            create: [
              { skill: "Environmental cleanup" },
              { skill: "First Aid" },
              { skill: "Team leadership" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "San Francisco" },
              { type: "CATEGORY", value: "ENVIRONMENT" },
            ],
          },
        },
      },
    },
  });

  const vol2 = await prisma.user.create({
    data: {
      name: "Aisha Rahman",
      email: "aisha.rahman@email.com",
      password,
      role: "USER",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0302",
          city: "Chicago",
          country: "USA",
          bio: "Educator who loves giving back to the community.",
          avatarUrl: "https://i.pravatar.cc/150?img=56",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityNote: "Saturdays only",
          experience: "5 years tutoring underserved youth",
          isVerified: true,
          skills: {
            create: [
              { skill: "Teaching" },
              { skill: "Curriculum design" },
              { skill: "Public speaking" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Chicago" },
              { type: "CATEGORY", value: "EDUCATION" },
            ],
          },
        },
      },
    },
  });

  const vol3 = await prisma.user.create({
    data: {
      name: "Marco Delgado",
      email: "marco.delgado@email.com",
      password,
      role: "USER",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0303",
          city: "Austin",
          country: "USA",
          bio: "Animal lover and weekend volunteer.",
          avatarUrl: "https://i.pravatar.cc/150?img=61",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityNote: "Flexible schedule",
          experience: "2 years at local animal shelter",
          isVerified: false,
          skills: {
            create: [{ skill: "Animal handling" }, { skill: "Fundraising" }],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Austin" },
              { type: "CATEGORY", value: "ANIMAL_WELFARE" },
            ],
          },
        },
      },
    },
  });

  const vol4 = await prisma.user.create({
    data: {
      name: "Lily Chen",
      email: "lily.chen@email.com",
      password,
      role: "USER",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0304",
          city: "San Francisco",
          country: "USA",
          bio: "Software engineer who volunteers on weekends.",
          avatarUrl: "https://i.pravatar.cc/150?img=44",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityNote: "Weekends",
          experience: "1 year environmental volunteering",
          isVerified: false,
          skills: {
            create: [
              { skill: "Data analysis" },
              { skill: "Social media" },
              { skill: "Environmental cleanup" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "San Francisco" },
              { type: "CATEGORY", value: "ENVIRONMENT" },
            ],
          },
        },
      },
    },
  });

  const vol5 = await prisma.user.create({
    data: {
      name: "David Okafor",
      email: "david.okafor@email.com",
      password,
      role: "USER",
      isActive: true,
      baseProfile: {
        create: {
          phone: "+1-555-0305",
          city: "Chicago",
          country: "USA",
          bio: "Community advocate and youth mentor.",
          avatarUrl: "https://i.pravatar.cc/150?img=67",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: false,
          availabilityNote: "Currently unavailable until July",
          experience: "4 years mentoring at-risk youth",
          isVerified: true,
          skills: {
            create: [
              { skill: "Mentoring" },
              { skill: "Sports coaching" },
              { skill: "Event planning" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Chicago" },
              { type: "CATEGORY", value: "SOCIAL" },
            ],
          },
        },
      },
    },
  });

  // CHARITY ACCOUNTS
  console.log("  → Charity accounts");

  const charity1 = await prisma.charityAccount.create({
    data: {
      userId: charity1User.id,
      name: "GreenEarth Foundation",
      description:
        "We protect and restore natural ecosystems through community-driven environmental action, education, and advocacy.",
      logoUrl: "https://picsum.photos/seed/greenearth/200",
      websiteUrl: "https://greenearth.org",
      phone: "+1-555-0201",
      address: "123 Eco Lane",
      city: "San Francisco",
      isVerified: true,
      category: "ENVIRONMENT",
    },
  });

  const charity2 = await prisma.charityAccount.create({
    data: {
      userId: charity2User.id,
      name: "Bright Futures Education",
      description:
        "Providing quality education and mentorship to underserved children and youth across underserved communities.",
      logoUrl: "https://picsum.photos/seed/brightfutures/200",
      websiteUrl: "https://brightfutures.org",
      phone: "+1-555-0202",
      address: "456 Learning Ave",
      city: "Chicago",
      isVerified: true,
      category: "EDUCATION",
    },
  });

  const charity3 = await prisma.charityAccount.create({
    data: {
      userId: charity3User.id,
      name: "Paws & Claws Rescue",
      description:
        "Rescuing, rehabilitating, and rehoming abandoned and abused animals since 2010.",
      logoUrl: "https://picsum.photos/seed/pawsclaws/200",
      websiteUrl: "https://pawsandclaws.org",
      phone: "+1-555-0203",
      address: "789 Pet Haven Blvd",
      city: "Austin",
      isVerified: false,
      category: "ANIMAL_WELFARE",
    },
  });

  // PROJECTS
  console.log("  → Projects");

  const project1 = await prisma.charityProject.create({
    data: {
      charityId: charity1.id,
      title: "Ocean Cleanup Initiative 2026",
      description:
        "A year-long campaign to remove plastic waste from coastal areas across California, involving community volunteers and corporate partners.",
      status: "ACTIVE",
      category: "ENVIRONMENT",
    },
  });

  const project2 = await prisma.charityProject.create({
    data: {
      charityId: charity1.id,
      title: "Urban Tree Planting Drive",
      description:
        "Planting 10,000 trees across urban neighborhoods in the Bay Area to combat air pollution.",
      status: "ACTIVE",
      category: "ENVIRONMENT",
    },
  });

  const project3 = await prisma.charityProject.create({
    data: {
      charityId: charity2.id,
      title: "After-School Tutoring Program",
      description:
        "Free tutoring sessions for K-12 students in low-income neighborhoods, covering math, science, and reading.",
      status: "ACTIVE",
      category: "EDUCATION",
    },
  });

  const project4 = await prisma.charityProject.create({
    data: {
      charityId: charity2.id,
      title: "Digital Literacy for Seniors",
      description:
        "Teaching basic computer and internet skills to elderly residents in community centers.",
      status: "PAUSED",
      category: "EDUCATION",
    },
  });

  const project5 = await prisma.charityProject.create({
    data: {
      charityId: charity3.id,
      title: "Shelter Support & Adoption Drive",
      description:
        "Supporting local animal shelters with volunteers for daily care and weekend adoption events.",
      status: "ACTIVE",
      category: "ANIMAL_WELFARE",
    },
  });

  // VOLUNTEERING OPPORTUNITIES
  console.log("  → Opportunities");

  const now = new Date();
  const d = (offsetDays) =>
    new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  // Ended opportunity (for ratings + certificates)
  const opp1 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: project1.id,
      title: "Baker Beach Cleanup — March Edition",
      description:
        "Join us for a morning of picking up plastic and debris from Baker Beach. Gloves and bags provided.",
      startDate: d(-30),
      endDate: d(-30),
      location: "Baker Beach, San Francisco, CA",
      maxSlots: 15,
      status: "ENDED",
    },
  });

  // Open opportunity with approved volunteers
  const opp2 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: project1.id,
      title: "Crissy Field Coastal Cleanup",
      description:
        "Help restore the Crissy Field shoreline. We'll focus on microplastics and invasive plant removal.",
      startDate: d(7),
      endDate: d(7),
      location: "Crissy Field, San Francisco, CA",
      maxSlots: 20,
      status: "OPEN",
    },
  });

  // Open opportunity
  const opp3 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: project2.id,
      title: "Tenderloin Tree Planting Day",
      description:
        "Plant 50 new trees along Tenderloin streets. No experience needed — just energy and enthusiasm!",
      startDate: d(14),
      endDate: d(14),
      location: "Tenderloin District, San Francisco, CA",
      maxSlots: 30,
      status: "OPEN",
    },
  });

  // Ended tutoring session
  const opp4 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity2.id,
      projectId: project3.id,
      title: "Spring Math Bootcamp",
      description:
        "Intensive weekend tutoring sessions in algebra and geometry for middle school students.",
      startDate: d(-14),
      endDate: d(-13),
      location: "Lincoln Community Center, Chicago, IL",
      maxSlots: 10,
      status: "ENDED",
    },
  });

  // Upcoming tutoring session
  const opp5 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity2.id,
      projectId: project3.id,
      title: "Summer Reading Circle",
      description:
        "Weekly reading sessions for elementary students. Volunteers read aloud and guide discussions.",
      startDate: d(21),
      endDate: d(90),
      location: "Bright Futures HQ, Chicago, IL",
      maxSlots: 8,
      status: "OPEN",
    },
  });

  // Animal shelter
  const opp6 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity3.id,
      projectId: project5.id,
      title: "Weekend Adoption Fair",
      description:
        "Help run our monthly adoption fair — greet visitors, assist with paperwork, and handle animals.",
      startDate: d(5),
      endDate: d(5),
      location: "Paws & Claws Shelter, Austin, TX",
      maxSlots: 12,
      status: "OPEN",
    },
  });

  // OPPORTUNITY APPLICATIONS
  console.log("  → Applications");

  // opp1 (ENDED beach cleanup) — vol1 and vol4 approved
  const app1 = await prisma.opportunityApplication.create({
    data: {
      userId: vol1.id,
      opportunityId: opp1.id,
      status: "APPROVED",
      message: "I've done beach cleanups before and would love to help out!",
    },
  });

  const app2 = await prisma.opportunityApplication.create({
    data: {
      userId: vol4.id,
      opportunityId: opp1.id,
      status: "APPROVED",
      message: "Really excited to contribute to this important cause.",
    },
  });

  // opp2 (OPEN coastal cleanup) — vol1 approved, vol4 pending
  const app3 = await prisma.opportunityApplication.create({
    data: {
      userId: vol1.id,
      opportunityId: opp2.id,
      status: "APPROVED",
      message: "Count me in — I know Crissy Field well.",
    },
  });

  const app4 = await prisma.opportunityApplication.create({
    data: {
      userId: vol4.id,
      opportunityId: opp2.id,
      status: "PENDING",
      message: "I'd love to join this cleanup session.",
    },
  });

  // opp3 (OPEN tree planting) — pending applications
  await prisma.opportunityApplication.create({
    data: {
      userId: vol1.id,
      opportunityId: opp3.id,
      status: "PENDING",
      message: "Planted trees with my neighborhood group last year!",
    },
  });

  await prisma.opportunityApplication.create({
    data: {
      userId: vol4.id,
      opportunityId: opp3.id,
      status: "DECLINED",
      message: "I'd like to participate.",
    },
  });

  // opp4 (ENDED spring bootcamp) — vol2 approved
  const app7 = await prisma.opportunityApplication.create({
    data: {
      userId: vol2.id,
      opportunityId: opp4.id,
      status: "APPROVED",
      message: "I teach math and would love to run sessions for these kids.",
    },
  });

  // opp5 (OPEN reading circle) — vol2 approved, vol5 pending
  const app8 = await prisma.opportunityApplication.create({
    data: {
      userId: vol2.id,
      opportunityId: opp5.id,
      status: "APPROVED",
      message: "Reading programs are my passion!",
    },
  });

  await prisma.opportunityApplication.create({
    data: {
      userId: vol5.id,
      opportunityId: opp5.id,
      status: "PENDING",
      message: "Would love to help young readers.",
    },
  });

  // opp6 (OPEN adoption fair) — vol3 approved, vol5 pending
  const app10 = await prisma.opportunityApplication.create({
    data: {
      userId: vol3.id,
      opportunityId: opp6.id,
      status: "APPROVED",
      message: "I volunteer at shelters regularly — happy to help!",
    },
  });

  await prisma.opportunityApplication.create({
    data: {
      userId: vol5.id,
      opportunityId: opp6.id,
      status: "PENDING",
      message: "Animal welfare is close to my heart.",
    },
  });

  // VOLUNTEER ROOMS
  console.log("  → Rooms & members");

  // Room for ENDED opp1 — closed
  const room1 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp1.id,
      status: "CLOSED",
      closedAt: d(-30),
      members: {
        create: [
          { userId: charity1User.id, role: "ADMIN" },
          { userId: vol1.id, role: "MEMBER" },
          { userId: vol4.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room for OPEN opp2 — active
  const room2 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp2.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity1User.id, role: "ADMIN" },
          { userId: vol1.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room for ENDED opp4
  const room3 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp4.id,
      status: "CLOSED",
      closedAt: d(-13),
      members: {
        create: [
          { userId: charity2User.id, role: "ADMIN" },
          { userId: vol2.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room for OPEN opp5
  const room4 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp5.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity2User.id, role: "ADMIN" },
          { userId: vol2.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room for opp6
  const room5 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp6.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity3User.id, role: "ADMIN" },
          { userId: vol3.id, role: "MEMBER" },
        ],
      },
    },
  });

  // ROOM MESSAGES
  console.log("  → Messages");

  // Room 1 (closed — beach cleanup history)
  await prisma.roomMessage.createMany({
    data: [
      {
        roomId: room1.id,
        senderId: charity1User.id,
        content:
          "Welcome everyone! Excited to have you join the Baker Beach Cleanup.",
        createdAt: d(-32),
      },
      {
        roomId: room1.id,
        senderId: vol1.id,
        content: "Thanks for having me! Should we bring our own gloves?",
        createdAt: d(-32),
      },
      {
        roomId: room1.id,
        senderId: charity1User.id,
        content:
          "We'll provide everything — just wear comfortable clothes you don't mind getting dirty.",
        createdAt: d(-32),
      },
      {
        roomId: room1.id,
        senderId: vol4.id,
        content: "Looking forward to it! What time should we arrive?",
        createdAt: d(-31),
      },
      {
        roomId: room1.id,
        senderId: charity1User.id,
        content: "Please arrive by 8:30am. We start at 9am sharp.",
        createdAt: d(-31),
      },
      {
        roomId: room1.id,
        senderId: vol1.id,
        content:
          "Great work today everyone! We collected over 200 lbs of plastic.",
        createdAt: d(-30),
      },
      {
        roomId: room1.id,
        senderId: charity1User.id,
        content:
          "Amazing effort from all of you! Thank you so much. Certificates will be sent shortly.",
        createdAt: d(-30),
      },
    ],
  });

  // Room 2 (active — upcoming coastal cleanup)
  await prisma.roomMessage.createMany({
    data: [
      {
        roomId: room2.id,
        senderId: charity1User.id,
        content:
          "Hi James! You're confirmed for the Crissy Field cleanup. We'll meet at the east parking lot.",
        createdAt: d(-2),
      },
      {
        roomId: room2.id,
        senderId: vol1.id,
        content:
          "Perfect, I know exactly where that is. Should I bring anything specific?",
        createdAt: d(-2),
      },
      {
        roomId: room2.id,
        senderId: charity1User.id,
        content:
          "Just sunscreen and water — everything else is provided. See you next week!",
        createdAt: d(-1),
      },
    ],
  });

  // Room 3 (closed — math bootcamp)
  await prisma.roomMessage.createMany({
    data: [
      {
        roomId: room3.id,
        senderId: charity2User.id,
        content:
          "Welcome Aisha! The bootcamp will run from 9am–3pm both days. 15 students will be attending.",
        createdAt: d(-16),
      },
      {
        roomId: room3.id,
        senderId: vol2.id,
        content:
          "Wonderful! I've prepared some algebra worksheets. Are there any specific weak areas to focus on?",
        createdAt: d(-16),
      },
      {
        roomId: room3.id,
        senderId: charity2User.id,
        content:
          "Fractions and basic equations are the main challenges. Your worksheets sound perfect.",
        createdAt: d(-15),
      },
      {
        roomId: room3.id,
        senderId: vol2.id,
        content:
          "Day 1 complete! The kids were fantastic — really engaged. Ready for tomorrow!",
        createdAt: d(-14),
      },
      {
        roomId: room3.id,
        senderId: charity2User.id,
        content:
          "You were amazing with them. Bootcamp is now complete — thank you so much Aisha!",
        createdAt: d(-13),
      },
    ],
  });

  // Room 4 (active — reading circle)
  await prisma.roomMessage.createMany({
    data: [
      {
        roomId: room4.id,
        senderId: charity2User.id,
        content:
          "Welcome to the Summer Reading Circle, Aisha! Sessions run every Saturday 10am–12pm.",
        createdAt: d(-1),
      },
      {
        roomId: room4.id,
        senderId: vol2.id,
        content:
          "So excited for this! Any suggested book list I can prepare with?",
        createdAt: d(-1),
      },
      {
        roomId: room4.id,
        senderId: charity2User.id,
        content:
          "Yes! I'll send you our curated list. We start with Charlotte's Web for the younger group.",
        createdAt: d(0),
      },
    ],
  });

  // Room 5 (active — adoption fair)
  await prisma.roomMessage.createMany({
    data: [
      {
        roomId: room5.id,
        senderId: charity3User.id,
        content:
          "Marco! Welcome aboard. The fair runs 10am–4pm. You'll be at the front desk helping visitors.",
        createdAt: d(-3),
      },
      {
        roomId: room5.id,
        senderId: vol3.id,
        content:
          "Perfect, I'm great with people. Should I wear anything specific?",
        createdAt: d(-3),
      },
      {
        roomId: room5.id,
        senderId: charity3User.id,
        content:
          "We'll give you a Paws & Claws t-shirt on the day. See you Saturday!",
        createdAt: d(-2),
      },
    ],
  });

  // RATINGS
  console.log("  → Ratings");

  await prisma.volunteerRating.createMany({
    data: [
      {
        charityId: charity1.id,
        volunteerId: vol1.id,
        opportunityId: opp1.id,
        rating: 5,
        comment:
          "James was exceptional — punctual, hardworking, and a great team player. Would love to have him back.",
      },
      {
        charityId: charity1.id,
        volunteerId: vol4.id,
        opportunityId: opp1.id,
        rating: 4,
        comment:
          "Lily did a great job. Very enthusiastic, especially with the younger volunteers.",
      },
      {
        charityId: charity2.id,
        volunteerId: vol2.id,
        opportunityId: opp4.id,
        rating: 5,
        comment:
          "Aisha was outstanding. The students loved her teaching style and her worksheets were incredibly effective.",
      },
    ],
  });

  // CERTIFICATES
  console.log("  → Certificates");

  await prisma.certificate.createMany({
    data: [
      {
        volunteerId: vol1.id,
        opportunityId: opp1.id,
        charityId: charity1.id,
        certificateData: {
          volunteerName: "James Carter",
          charityName: "GreenEarth Foundation",
          opportunityTitle: "Baker Beach Cleanup — March Edition",
          startDate: d(-30),
          endDate: d(-30),
          issuedAt: d(-28),
        },
      },
      {
        volunteerId: vol4.id,
        opportunityId: opp1.id,
        charityId: charity1.id,
        certificateData: {
          volunteerName: "Lily Chen",
          charityName: "GreenEarth Foundation",
          opportunityTitle: "Baker Beach Cleanup — March Edition",
          startDate: d(-30),
          endDate: d(-30),
          issuedAt: d(-28),
        },
      },
      {
        volunteerId: vol2.id,
        opportunityId: opp4.id,
        charityId: charity2.id,
        certificateData: {
          volunteerName: "Aisha Rahman",
          charityName: "Bright Futures Education",
          opportunityTitle: "Spring Math Bootcamp",
          startDate: d(-14),
          endDate: d(-13),
          issuedAt: d(-12),
        },
      },
    ],
  });

  // NOTIFICATIONS
  console.log("  → Notifications");

  await prisma.notification.createMany({
    data: [
      // Admin notifications
      {
        userId: admin.id,
        title: "New Registration Request",
        message: "Healing Hands Medical has submitted a registration request.",
        type: "INFO",
        isRead: false,
        link: "/requests",
      },
      {
        userId: admin.id,
        title: "Charity Verification Requested",
        message:
          "Paws & Claws Rescue has submitted verification documents for review.",
        type: "INFO",
        isRead: true,
        link: "/requests",
      },
      {
        userId: admin.id,
        title: "Registration Approved",
        message: "GreenEarth Foundation registration was approved.",
        type: "SUCCESS",
        isRead: true,
        link: "/charities",
      },
      // Volunteer notifications
      {
        userId: vol1.id,
        title: "Application Approved!",
        message:
          'Your application for "Crissy Field Coastal Cleanup" has been approved. You\'ve been added to the volunteer room.',
        type: "SUCCESS",
        isRead: false,
        link: "/opportunities/2/room",
      },
      {
        userId: vol1.id,
        title: "Certificate Issued!",
        message:
          'You\'ve been issued a certificate for completing "Baker Beach Cleanup — March Edition".',
        type: "SUCCESS",
        isRead: true,
        link: "/profile/certificates",
      },
      {
        userId: vol1.id,
        title: "You received a rating",
        message:
          'You received a 5/5 rating for "Baker Beach Cleanup — March Edition". Comment: James was exceptional.',
        type: "INFO",
        isRead: false,
        link: "/profile/ratings",
      },
      {
        userId: vol2.id,
        title: "Application Approved!",
        message:
          'Your application for "Summer Reading Circle" has been approved.',
        type: "SUCCESS",
        isRead: false,
        link: "/opportunities/5/room",
      },
      {
        userId: vol2.id,
        title: "Certificate Issued!",
        message:
          'You\'ve been issued a certificate for completing "Spring Math Bootcamp".',
        type: "SUCCESS",
        isRead: true,
        link: "/profile/certificates",
      },
      {
        userId: vol3.id,
        title: "Application Approved!",
        message:
          'Your application for "Weekend Adoption Fair" has been approved.',
        type: "SUCCESS",
        isRead: false,
        link: "/opportunities/6/room",
      },
      {
        userId: vol4.id,
        title: "Application Declined",
        message:
          'Your application for "Tenderloin Tree Planting Day" has been declined.',
        type: "WARNING",
        isRead: false,
        link: "/opportunities/3",
      },
      {
        userId: vol4.id,
        title: "Certificate Issued!",
        message:
          'You\'ve been issued a certificate for completing "Baker Beach Cleanup — March Edition".',
        type: "SUCCESS",
        isRead: true,
        link: "/profile/certificates",
      },
    ],
  });

  // REGISTRATION REQUESTS
  console.log("  → Registration requests");

  await prisma.registrationRequest.createMany({
    data: [
      {
        status: "PENDING",
        name: "Healing Hands Medical Aid",
        email: "register@healinghands.org",
        phone: "+1-555-0401",
        city: "Houston",
        category: "HEALTH",
        message:
          "We provide free medical consultations to uninsured residents across Houston. Seeking volunteers with medical backgrounds.",
      },
      {
        status: "APPROVED",
        name: "GreenEarth Foundation",
        email: "contact@greenearth.org",
        phone: "+1-555-0201",
        city: "San Francisco",
        category: "ENVIRONMENT",
        message: "Environmental nonprofit focused on coastal restoration.",
        reviewedBy: admin.id,
        reviewedAt: d(-60),
        reviewNote:
          "Strong application with clear mission and established track record.",
      },
      {
        status: "DECLINED",
        name: "Quick Cash Charity",
        email: "info@quickcash.org",
        phone: "+1-555-0999",
        city: "Las Vegas",
        category: "OTHER",
        message: "We redistribute funds to needy individuals.",
        reviewedBy: admin.id,
        reviewedAt: d(-45),
        reviewNote:
          "Insufficient documentation and unclear fund allocation practices.",
      },
    ],
  });

  // VERIFICATION REQUESTS
  console.log("  → Verification requests");

  await prisma.verificationRequest.createMany({
    data: [
      {
        status: "PENDING",
        userId: charity3User.id,
        documents: [
          "https://storage.example.com/docs/paws-501c3.pdf",
          "https://storage.example.com/docs/paws-annual-report.pdf",
        ],
        message:
          "Submitting our 501(c)(3) certificate and last year's annual report for verification.",
      },
      {
        status: "APPROVED",
        userId: charity1User.id,
        documents: [
          "https://storage.example.com/docs/greenearth-501c3.pdf",
          "https://storage.example.com/docs/greenearth-financials.pdf",
          "https://storage.example.com/docs/greenearth-board-resolution.pdf",
        ],
        message: "All documentation attached as requested.",
        reviewedBy: admin.id,
        reviewedAt: d(-90),
        reviewNote: "All documents valid and in order. Charity verified.",
      },
    ],
  });

  // AUDIT LOGS
  console.log("  → Audit logs");

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "APPROVE_REGISTRATION",
        target: "GreenEarth Foundation",
        targetType: "RegistrationRequest",
        details: "Registration request approved and charity account created.",
        ipAddress: "192.168.1.100",
      },
      {
        userId: admin.id,
        action: "APPROVE_VERIFICATION",
        target: "GreenEarth Foundation",
        targetType: "VerificationRequest",
        details: "Verification approved. isVerified set to true.",
        ipAddress: "192.168.1.100",
      },
      {
        userId: admin.id,
        action: "DECLINE_REGISTRATION",
        target: "Quick Cash Charity",
        targetType: "RegistrationRequest",
        details: "Declined due to insufficient documentation.",
        ipAddress: "192.168.1.100",
      },
      {
        userId: admin.id,
        action: "UPDATE_USER",
        target: "David Okafor",
        targetType: "User",
        details:
          "Updated user role from USER to USER (no change). Profile reviewed.",
        ipAddress: "192.168.1.101",
      },
      {
        userId: admin.id,
        action: "CREATE_USER",
        target: "Lily Chen",
        targetType: "User",
        details: "New user account created by admin.",
        ipAddress: "192.168.1.100",
      },
    ],
  });

  // PLATFORM SETTINGS
  console.log("  → Platform settings");

  await prisma.platformSetting.createMany({
    data: [
      { key: "platform_name", value: "NGO Connect" },
      { key: "platform_email", value: "support@ngoconnect.org" },
      { key: "max_file_size_mb", value: "10" },
      { key: "allow_public_registration", value: "true" },
      { key: "require_charity_verification", value: "false" },
      { key: "maintenance_mode", value: "false" },
    ],
  });

  // EMAIL TEMPLATES
  console.log("  → Email templates");

  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "registration_approved",
        name: "Registration Approved",
        description:
          "Sent to charities when their registration request is approved.",
        subject:
          "Your registration has been approved — Welcome to NGO Connect!",
        body: "Dear {{name}},\n\nCongratulations! Your registration request has been approved. You can now log in and start posting volunteering opportunities.\n\nBest regards,\nThe NGO Connect Team",
        variables: ["name"],
      },
      {
        key: "registration_declined",
        name: "Registration Declined",
        description:
          "Sent to charities when their registration request is declined.",
        subject: "Update on your NGO Connect registration request",
        body: "Dear {{name}},\n\nWe've reviewed your registration request and unfortunately we're unable to approve it at this time.\n\nReason: {{reason}}\n\nYou're welcome to reapply once you've addressed the above.\n\nBest regards,\nThe NGO Connect Team",
        variables: ["name", "reason"],
      },
      {
        key: "verification_approved",
        name: "Verification Approved",
        description: "Sent when a charity is verified.",
        subject: "Your charity is now verified on NGO Connect!",
        body: "Dear {{name}},\n\nGreat news — your charity has been verified! A verified badge will now appear on your profile, increasing trust with volunteers.\n\nBest regards,\nThe NGO Connect Team",
        variables: ["name"],
      },
      {
        key: "application_approved",
        name: "Application Approved",
        description: "Sent to volunteers when their application is approved.",
        subject: "You're in! Application approved for {{opportunityTitle}}",
        body: 'Dear {{volunteerName}},\n\nYour application for "{{opportunityTitle}}" has been approved! You\'ve been added to the volunteer room where you can chat with the team.\n\nSee you there!\nThe NGO Connect Team',
        variables: ["volunteerName", "opportunityTitle"],
      },
    ],
  });

  // 17. INTEGRATIONS
  console.log("  → Integrations");

  await prisma.integration.createMany({
    data: [
      {
        name: "Slack",
        description: "Send notifications to Slack channels",
        icon: "slack",
        status: "disconnected",
        config: "{}",
      },
      {
        name: "Google Calendar",
        description: "Sync volunteer opportunities with Google Calendar",
        icon: "google-calendar",
        status: "disconnected",
        config: "{}",
      },
      {
        name: "Mailchimp",
        description: "Sync volunteer lists with Mailchimp for newsletters",
        icon: "mailchimp",
        status: "disconnected",
        config: "{}",
      },
      {
        name: "Stripe",
        description: "Accept donations via Stripe",
        icon: "stripe",
        status: "disconnected",
        config: "{}",
      },
    ],
  });

  console.log("\n✅ Seeding complete!\n");
  console.log("  Login credentials (all accounts use the same password):");
  console.log("  Password: Password123!\n");
  console.log("  admin@ngoplatform.com       → ADMIN");
  console.log(
    "  contact@greenearth.org      → CHARITY (verified, 3 opportunities)",
  );
  console.log(
    "  hello@brightfutures.org     → CHARITY (verified, 2 opportunities)",
  );
  console.log(
    "  info@pawsandclaws.org       → CHARITY (unverified, 1 opportunity)",
  );
  console.log(
    "  james.carter@email.com      → USER / volunteer (approved, active room)",
  );
  console.log(
    "  aisha.rahman@email.com      → USER / volunteer (approved, active room)",
  );
  console.log(
    "  marco.delgado@email.com     → USER / volunteer (approved, active room)",
  );
  console.log(
    "  lily.chen@email.com         → USER / volunteer (pending applications)",
  );
  console.log(
    "  david.okafor@email.com      → USER / volunteer (pending applications)\n",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
