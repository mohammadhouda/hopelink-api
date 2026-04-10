import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Hope Link with Lebanese data...\n");

  // ── Clear all tables (order matters) ──────────────────────
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.roomMessage.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.volunteerRoom.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.volunteerRating.deleteMany();
  await prisma.opportunityApplication.deleteMany();
  await prisma.volunteeringOpportunity.deleteMany();
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
  const now = new Date();
  const d = (offsetDays) => new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  // ══════════════════════════════════════════════════════════
  //  USERS
  // ══════════════════════════════════════════════════════════
  console.log("  → Users");

  const admin = await prisma.user.create({
    data: {
      name: "Mohammad Houda",
      email: "admin@hopelink.org",
      password,
      role: "ADMIN",
      isActive: true,
      lastLoginAt: d(-1),
      baseProfile: {
        create: {
          phone: "+961 3 456 789",
          city: "Beirut",
          country: "Lebanon",
          bio: "Hope Link platform administrator. Coordinating humanitarian operations across Lebanon since 2022.",
        },
      },
    },
  });

  // ── Charity users ────────────────────────────────────────
  const charity1User = await prisma.user.create({
    data: {
      name: "Beit El Baraka",
      email: "info@beitelbaraka.org",
      password,
      role: "CHARITY",
      isActive: true,
      lastLoginAt: d(-2),
      baseProfile: {
        create: {
          phone: "+961 1 123 456",
          city: "Beirut",
          country: "Lebanon",
        },
      },
    },
  });

  const charity2User = await prisma.user.create({
    data: {
      name: "Nusaned",
      email: "contact@nusaned.org",
      password,
      role: "CHARITY",
      isActive: true,
      lastLoginAt: d(-1),
      baseProfile: {
        create: {
          phone: "+961 1 234 567",
          city: "Beirut",
          country: "Lebanon",
        },
      },
    },
  });

  const charity3User = await prisma.user.create({
    data: {
      name: "Arcenciel",
      email: "info@arcenciel.org",
      password,
      role: "CHARITY",
      isActive: true,
      lastLoginAt: d(-3),
      baseProfile: {
        create: {
          phone: "+961 5 927 100",
          city: "Sin El Fil",
          country: "Lebanon",
        },
      },
    },
  });

  const charity4User = await prisma.user.create({
    data: {
      name: "Lebanese Food Bank",
      email: "hello@lebfoodbank.org",
      password,
      role: "CHARITY",
      isActive: true,
      lastLoginAt: d(-1),
      baseProfile: {
        create: {
          phone: "+961 70 888 999",
          city: "Beirut",
          country: "Lebanon",
        },
      },
    },
  });

  const charity5User = await prisma.user.create({
    data: {
      name: "Himaya",
      email: "contact@himaya.org",
      password,
      role: "CHARITY",
      isActive: true,
      lastLoginAt: d(-5),
      baseProfile: {
        create: {
          phone: "+961 1 395 394",
          city: "Hazmieh",
          country: "Lebanon",
        },
      },
    },
  });

  // ── Volunteer users ──────────────────────────────────────
  const vol1 = await prisma.user.create({
    data: {
      name: "Karim Haddad",
      email: "karim.haddad@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(-1),
      baseProfile: {
        create: {
          phone: "+961 71 123 456",
          city: "Beirut",
          country: "Lebanon",
          bio: "Civil engineering student at AUB. Passionate about rebuilding Beirut and giving back to the community.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityDays: ["SATURDAY", "WEDNESDAY"],
          experience: "2 years volunteering with post-blast Beirut reconstruction efforts. Helped distribute food packages in Karantina after the August 4 explosion.",
          isVerified: true,
          skills: {
            create: [
              { skill: "Construction & manual labor" },
              { skill: "First Aid certified" },
              { skill: "Arabic/English/French" },
              { skill: "Team coordination" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Beirut" },
              { type: "CATEGORY", value: "SOCIAL" },
            ],
          },
        },
      },
    },
  });

  const vol2 = await prisma.user.create({
    data: {
      name: "Lara Mouawad",
      email: "lara.mouawad@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(-2),
      baseProfile: {
        create: {
          phone: "+961 76 789 012",
          city: "Jounieh",
          country: "Lebanon",
          bio: "Nutritionist and mother of two. Volunteers with food banks and runs community cooking workshops for families affected by the economic crisis.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityDays: ["SATURDAY"],
          experience: "3 years working with the Lebanese Food Bank sorting and distributing donations. Organized community kitchens in Jounieh serving 200+ meals weekly.",
          isVerified: true,
          skills: {
            create: [
              { skill: "Nutrition & dietetics" },
              { skill: "Food sorting & packaging" },
              { skill: "Community kitchen management" },
              { skill: "Arabic/English" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Jounieh" },
              { type: "CATEGORY", value: "HEALTH" },
            ],
          },
        },
      },
    },
  });

  const vol3 = await prisma.user.create({
    data: {
      name: "Omar Darwish",
      email: "omar.darwish@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(0),
      baseProfile: {
        create: {
          phone: "+961 70 456 789",
          city: "Tripoli",
          country: "Lebanon",
          bio: "Social worker from Tripoli. Working with displaced families in the north since 2019.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityDays: ["SATURDAY", "WEDNESDAY"],
          experience: "4 years supporting Syrian refugee families in Tripoli and the Bekaa. Conducted needs assessments for UNHCR partner organizations.",
          isVerified: true,
          skills: {
            create: [
              { skill: "Social work & case management" },
              { skill: "Psychosocial support" },
              { skill: "Arabic/English" },
              { skill: "Report writing" },
              { skill: "Conflict resolution" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Tripoli" },
              { type: "CATEGORY", value: "SOCIAL" },
            ],
          },
        },
      },
    },
  });

  const vol4 = await prisma.user.create({
    data: {
      name: "Maya Sarkis",
      email: "maya.sarkis@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(-4),
      baseProfile: {
        create: {
          phone: "+961 3 234 567",
          city: "Zahle",
          country: "Lebanon",
          bio: "Pharmacy student at LAU. Interested in health outreach and medication access for underserved communities in the Bekaa.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityDays: ["SATURDAY", "WEDNESDAY"],
          experience: "1 year assisting at mobile health clinics in the Bekaa Valley organized by Arcenciel.",
          isVerified: false,
          skills: {
            create: [
              { skill: "Basic medical assistance" },
              { skill: "Pharmacy knowledge" },
              { skill: "Arabic/English/French" },
              { skill: "Data entry" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Zahle" },
              { type: "CATEGORY", value: "HEALTH" },
            ],
          },
        },
      },
    },
  });

  const vol5 = await prisma.user.create({
    data: {
      name: "Rami Najjar",
      email: "rami.najjar@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(-1),
      baseProfile: {
        create: {
          phone: "+961 78 567 890",
          city: "Sidon",
          country: "Lebanon",
          bio: "Teacher at a public school in Sidon. Passionate about education access for children affected by displacement.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: false,
          availabilityDays: [],
          experience: "5 years teaching in public schools. Ran after-school tutoring for 30+ students from displaced families in Ain el-Hilweh area.",
          isVerified: true,
          skills: {
            create: [
              { skill: "Teaching & tutoring" },
              { skill: "Curriculum development" },
              { skill: "Arabic/English" },
              { skill: "Child psychology basics" },
              { skill: "Event organizing" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Sidon" },
              { type: "CATEGORY", value: "EDUCATION" },
            ],
          },
        },
      },
    },
  });

  const vol6 = await prisma.user.create({
    data: {
      name: "Nadia Awad",
      email: "nadia.awad@gmail.com",
      password,
      role: "USER",
      isActive: true,
      lastLoginAt: d(-2),
      baseProfile: {
        create: {
          phone: "+961 71 678 901",
          city: "Beirut",
          country: "Lebanon",
          bio: "Graphic designer and photographer. Documents humanitarian work and creates awareness campaigns for NGOs.",
        },
      },
      volunteerProfile: {
        create: {
          isAvailable: true,
          availabilityDays: ["WEDNESDAY", "SATURDAY"],
          experience: "Designed campaign materials for Beit El Baraka and Nusaned. Photographed food distribution events in Bourj Hammoud.",
          isVerified: false,
          skills: {
            create: [
              { skill: "Graphic design" },
              { skill: "Photography" },
              { skill: "Social media management" },
              { skill: "Arabic/English/French" },
            ],
          },
          preferences: {
            create: [
              { type: "CITY", value: "Beirut" },
              { type: "CATEGORY", value: "OTHER" },
            ],
          },
        },
      },
    },
  });

  // ══════════════════════════════════════════════════════════
  //  CHARITY ACCOUNTS
  // ══════════════════════════════════════════════════════════
  console.log("  → Charity accounts");

  const charity1 = await prisma.charityAccount.create({
    data: {
      userId: charity1User.id,
      name: "Beit El Baraka",
      description: "A Lebanese initiative that transforms abandoned buildings into dignified supermarkets where families affected by the economic crisis can shop for free with a points-based card system. Operating 3 locations across Beirut.",
      logoUrl: "https://picsum.photos/seed/beitelbaraka/200",
      websiteUrl: "https://beitelbaraka.org",
      phone: "+961 1 123 456",
      address: "Mar Mikhael, Beirut",
      city: "Beirut",
      isVerified: true,
      category: "SOCIAL",
    },
  });

  const charity2 = await prisma.charityAccount.create({
    data: {
      userId: charity2User.id,
      name: "Nusaned",
      description: "A grassroots Lebanese organization providing education scholarships, vocational training, and emergency relief to families impacted by the ongoing economic collapse. Focused on creating self-sufficiency rather than dependency.",
      logoUrl: "https://picsum.photos/seed/nusaned/200",
      websiteUrl: "https://nusaned.org",
      phone: "+961 1 234 567",
      address: "Clemenceau, Beirut",
      city: "Beirut",
      isVerified: true,
      category: "EDUCATION",
    },
  });

  const charity3 = await prisma.charityAccount.create({
    data: {
      userId: charity3User.id,
      name: "Arcenciel",
      description: "One of Lebanon's oldest and most trusted NGOs, providing healthcare, disability services, environmental programs, and social enterprise across the country. Operating since 1985 with 12 centers nationwide.",
      logoUrl: "https://picsum.photos/seed/arcenciel/200",
      websiteUrl: "https://arcenciel.org",
      phone: "+961 5 927 100",
      address: "Sin El Fil, Mount Lebanon",
      city: "Sin El Fil",
      isVerified: true,
      category: "HEALTH",
    },
  });

  const charity4 = await prisma.charityAccount.create({
    data: {
      userId: charity4User.id,
      name: "Lebanese Food Bank",
      description: "Fighting hunger and reducing food waste in Lebanon by collecting surplus food from restaurants, hotels, and farms and redistributing it to families in need. Served over 50,000 families since 2020.",
      logoUrl: "https://picsum.photos/seed/lebfoodbank/200",
      websiteUrl: "https://lebfoodbank.org",
      phone: "+961 70 888 999",
      address: "Badaro, Beirut",
      city: "Beirut",
      isVerified: true,
      category: "SOCIAL",
    },
  });

  const charity5 = await prisma.charityAccount.create({
    data: {
      userId: charity5User.id,
      name: "Himaya",
      description: "Lebanon's leading child protection organization. Runs awareness campaigns, a national helpline for reporting child abuse, and provides psychosocial support to children and families across all governorates.",
      logoUrl: "https://picsum.photos/seed/himaya/200",
      websiteUrl: "https://himaya.org",
      phone: "+961 1 395 394",
      address: "Hazmieh, Mount Lebanon",
      city: "Hazmieh",
      isVerified: false,
      category: "EDUCATION",
    },
  });

  // ══════════════════════════════════════════════════════════
  //  PROJECTS
  // ══════════════════════════════════════════════════════════
  console.log("  → Projects");

  const proj1 = await prisma.charityProject.create({
    data: {
      charityId: charity1.id,
      title: "Karantina Community Market",
      description: "Setting up and running the Karantina branch of Beit El Baraka's free supermarket, serving 400+ families in one of Beirut's most affected neighborhoods after the port explosion.",
      status: "ACTIVE",
      category: "SOCIAL",
    },
  });

  const proj2 = await prisma.charityProject.create({
    data: {
      charityId: charity1.id,
      title: "Bourj Hammoud Winter Relief",
      description: "Providing heating fuel, blankets, and winter clothing to vulnerable families in the Bourj Hammoud area during the harsh winter months when many cannot afford electricity.",
      status: "ACTIVE",
      category: "SOCIAL",
    },
  });

  const proj3 = await prisma.charityProject.create({
    data: {
      charityId: charity2.id,
      title: "Scholarship Fund 2026",
      description: "Providing tuition scholarships for 200 university students who cannot afford fees after the lira collapse. Covers LAU, AUB, USJ, and public universities.",
      status: "ACTIVE",
      category: "EDUCATION",
    },
  });

  const proj4 = await prisma.charityProject.create({
    data: {
      charityId: charity2.id,
      title: "Vocational Training — North Lebanon",
      description: "Six-month vocational training program in Tripoli covering carpentry, electrical work, and plumbing for unemployed youth aged 18-30.",
      status: "PAUSED",
      category: "EDUCATION",
    },
  });

  const proj5 = await prisma.charityProject.create({
    data: {
      charityId: charity3.id,
      title: "Bekaa Mobile Health Clinics",
      description: "Operating mobile health clinics across the Bekaa Valley providing free medical consultations, medications, and vaccinations to underserved Lebanese and refugee communities.",
      status: "ACTIVE",
      category: "HEALTH",
    },
  });

  const proj6 = await prisma.charityProject.create({
    data: {
      charityId: charity4.id,
      title: "Ramadan Food Drive 2026",
      description: "Annual Ramadan campaign collecting and distributing food parcels to 5,000+ families across Lebanon. Partnering with supermarkets, restaurants, and farms.",
      status: "ACTIVE",
      category: "SOCIAL",
    },
  });

  const proj7 = await prisma.charityProject.create({
    data: {
      charityId: charity5.id,
      title: "Safe Schools Program",
      description: "Training teachers and school staff across Lebanon on identifying and responding to signs of child abuse, neglect, and bullying.",
      status: "ACTIVE",
      category: "EDUCATION",
    },
  });

  // ══════════════════════════════════════════════════════════
  //  VOLUNTEERING OPPORTUNITIES
  // ══════════════════════════════════════════════════════════
  console.log("  → Opportunities");

  // Ended
  const opp1 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: proj1.id,
      title: "Karantina Market Setup — March Shift",
      description: "Help sort donated goods, stock shelves, and assist families during shopping hours at the Karantina free supermarket. Arabic speakers needed for family interaction.",
      startDate: d(-30),
      endDate: d(-30),
      location: "Karantina, Beirut",
      maxSlots: 12,
      status: "ENDED",
    },
  });

  // Open
  const opp2 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: proj1.id,
      title: "Karantina Market — April Weekend Volunteers",
      description: "Regular weekend volunteering at Beit El Baraka's Karantina location. Tasks include receiving donations, organizing inventory, and welcoming families.",
      startDate: d(5),
      endDate: d(5),
      location: "Karantina, Beirut",
      maxSlots: 8,
      status: "OPEN",
    },
  });

  const opp3 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity1.id,
      projectId: proj2.id,
      title: "Bourj Hammoud Blanket Distribution",
      description: "Door-to-door distribution of blankets and winter supplies in Bourj Hammoud. Volunteers will work in pairs and need to carry supplies up staircases in old buildings.",
      startDate: d(10),
      endDate: d(10),
      location: "Bourj Hammoud, Mount Lebanon",
      maxSlots: 20,
      status: "OPEN",
    },
  });

  // Ended tutoring
  const opp4 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity2.id,
      projectId: proj3.id,
      title: "Scholarship Interview Day — Beirut",
      description: "Assist with interviewing scholarship candidates at the Beirut center. Volunteers will help guide students through the process and provide logistical support.",
      startDate: d(-14),
      endDate: d(-14),
      location: "Clemenceau, Beirut",
      maxSlots: 10,
      status: "ENDED",
    },
  });

  // Open
  const opp5 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity2.id,
      projectId: proj3.id,
      title: "University Application Support Sessions",
      description: "Help high school students from underprivileged backgrounds prepare their university applications. Review personal statements and guide them through the process.",
      startDate: d(14),
      endDate: d(60),
      location: "Nusaned Center, Beirut",
      maxSlots: 6,
      status: "OPEN",
    },
  });

  const opp6 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity3.id,
      projectId: proj5.id,
      title: "Bekaa Health Clinic — Zahle Session",
      description: "Assist the medical team during a mobile clinic session in Zahle. Tasks include patient registration, pharmacy support, and crowd management. Medical background preferred but not required.",
      startDate: d(7),
      endDate: d(7),
      location: "Zahle, Bekaa Valley",
      maxSlots: 15,
      status: "OPEN",
    },
  });

  const opp7 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity4.id,
      projectId: proj6.id,
      title: "Ramadan Food Parcel Packing",
      description: "Join our warehouse team to sort donations and pack 500 food parcels for distribution during Ramadan. Parcels include rice, lentils, oil, sugar, and canned goods.",
      startDate: d(3),
      endDate: d(3),
      location: "Badaro Warehouse, Beirut",
      maxSlots: 25,
      status: "OPEN",
    },
  });

  const opp8 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity4.id,
      projectId: proj6.id,
      title: "Ramadan Iftar Distribution — Tariq El Jdideh",
      description: "Distribute hot Iftar meals to families in Tariq El Jdideh and surrounding areas. Volunteers will help load vans, navigate neighborhoods, and hand-deliver meals door to door.",
      startDate: d(8),
      endDate: d(8),
      location: "Tariq El Jdideh, Beirut",
      maxSlots: 15,
      status: "OPEN",
    },
  });

  const opp9 = await prisma.volunteeringOpportunity.create({
    data: {
      charityId: charity5.id,
      projectId: proj7.id,
      title: "Child Safety Workshop — School Training",
      description: "Help facilitate workshops for teachers in Sidon schools on recognizing signs of child abuse and proper reporting procedures. Training materials provided.",
      startDate: d(21),
      endDate: d(21),
      location: "Sidon, South Lebanon",
      maxSlots: 8,
      status: "OPEN",
    },
  });

  // ══════════════════════════════════════════════════════════
  //  APPLICATIONS
  // ══════════════════════════════════════════════════════════
  console.log("  → Applications");

  // opp1 (ENDED Karantina March) — Karim & Nadia approved
  const app1 = await prisma.opportunityApplication.create({
    data: { userId: vol1.id, opportunityId: opp1.id, status: "APPROVED", message: "I helped with Karantina cleanup before and know the area well. Happy to sort and stock." },
  });
  const app2 = await prisma.opportunityApplication.create({
    data: { userId: vol6.id, opportunityId: opp1.id, status: "APPROVED", message: "I'd like to photograph the event for awareness and also help with families." },
  });

  // opp2 (OPEN Karantina April) — Karim approved, Nadia pending
  const app3 = await prisma.opportunityApplication.create({
    data: { userId: vol1.id, opportunityId: opp2.id, status: "APPROVED", message: "Count me in again — I loved the last Karantina shift." },
  });
  await prisma.opportunityApplication.create({
    data: { userId: vol6.id, opportunityId: opp2.id, status: "PENDING", message: "Would love to continue helping at Karantina this month." },
  });

  // opp3 (OPEN Bourj Hammoud) — pending
  await prisma.opportunityApplication.create({
    data: { userId: vol1.id, opportunityId: opp3.id, status: "PENDING", message: "I can carry heavy supplies — happy to help with the distribution." },
  });

  // opp4 (ENDED scholarship interviews) — Lara approved
  const app7 = await prisma.opportunityApplication.create({
    data: { userId: vol2.id, opportunityId: opp4.id, status: "APPROVED", message: "I've helped organize similar events before. Ready to support the students." },
  });

  // opp5 (OPEN university support) — Omar approved, Rami pending
  const app8 = await prisma.opportunityApplication.create({
    data: { userId: vol3.id, opportunityId: opp5.id, status: "APPROVED", message: "As a social worker I've helped many students navigate applications." },
  });
  await prisma.opportunityApplication.create({
    data: { userId: vol5.id, opportunityId: opp5.id, status: "PENDING", message: "I'm a teacher and would love to help students with their personal statements." },
  });

  // opp6 (OPEN Bekaa clinic) — Maya approved, Omar pending
  const app10 = await prisma.opportunityApplication.create({
    data: { userId: vol4.id, opportunityId: opp6.id, status: "APPROVED", message: "I'm a pharmacy student and have assisted at Arcenciel clinics before." },
  });
  await prisma.opportunityApplication.create({
    data: { userId: vol3.id, opportunityId: opp6.id, status: "PENDING", message: "I work with displaced communities in the north and can help with registration." },
  });

  // opp7 (OPEN Ramadan packing) — Lara & Karim approved, Nadia pending
  const app12 = await prisma.opportunityApplication.create({
    data: { userId: vol2.id, opportunityId: opp7.id, status: "APPROVED", message: "I've worked with the food bank before — I know the packing process well." },
  });
  const app13 = await prisma.opportunityApplication.create({
    data: { userId: vol1.id, opportunityId: opp7.id, status: "APPROVED", message: "I can do heavy lifting and help organize the warehouse logistics." },
  });
  await prisma.opportunityApplication.create({
    data: { userId: vol6.id, opportunityId: opp7.id, status: "PENDING", message: "I'd like to document the packing and also help out." },
  });

  // opp8 (OPEN Iftar distribution) — Omar approved
  const app15 = await prisma.opportunityApplication.create({
    data: { userId: vol3.id, opportunityId: opp8.id, status: "APPROVED", message: "I know Tariq El Jdideh well from my social work. I can help navigate." },
  });

  // opp9 (OPEN child safety) — Rami declined
  await prisma.opportunityApplication.create({
    data: { userId: vol5.id, opportunityId: opp9.id, status: "DECLINED", message: "I teach in Sidon schools and know many of the staff personally." },
  });

  // ══════════════════════════════════════════════════════════
  //  VOLUNTEER ROOMS
  // ══════════════════════════════════════════════════════════
  console.log("  → Rooms & members");

  // Room 1 — opp1 ENDED (closed)
  const room1 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp1.id,
      status: "CLOSED",
      closedAt: d(-30),
      members: {
        create: [
          { userId: charity1User.id, role: "ADMIN" },
          { userId: vol1.id, role: "MEMBER" },
          { userId: vol6.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room 2 — opp2 OPEN
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

  // Room 3 — opp4 ENDED (closed)
  const room3 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp4.id,
      status: "CLOSED",
      closedAt: d(-14),
      members: {
        create: [
          { userId: charity2User.id, role: "ADMIN" },
          { userId: vol2.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room 4 — opp5 OPEN
  const room4 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp5.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity2User.id, role: "ADMIN" },
          { userId: vol3.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room 5 — opp6 OPEN
  const room5 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp6.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity3User.id, role: "ADMIN" },
          { userId: vol4.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room 6 — opp7 OPEN
  const room6 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp7.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity4User.id, role: "ADMIN" },
          { userId: vol2.id, role: "MEMBER" },
          { userId: vol1.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Room 7 — opp8 OPEN
  const room7 = await prisma.volunteerRoom.create({
    data: {
      opportunityId: opp8.id,
      status: "ACTIVE",
      members: {
        create: [
          { userId: charity4User.id, role: "ADMIN" },
          { userId: vol3.id, role: "MEMBER" },
        ],
      },
    },
  });

  // ══════════════════════════════════════════════════════════
  //  MESSAGES
  // ══════════════════════════════════════════════════════════
  console.log("  → Messages");

  // Room 1 — Karantina March (closed)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room1.id, senderId: charity1User.id, content: "Ahla w sahla! Welcome to the Karantina market team. We're setting up this Saturday at 8am.", createdAt: d(-33) },
      { roomId: room1.id, senderId: vol1.id, content: "Great! I'll be there early. Should I bring anything?", createdAt: d(-33) },
      { roomId: room1.id, senderId: charity1User.id, content: "Just comfortable clothes and closed shoes. We provide gloves and aprons. Parking is available behind the building.", createdAt: d(-33) },
      { roomId: room1.id, senderId: vol6.id, content: "I'll bring my camera too — is it okay to take photos during the event?", createdAt: d(-32) },
      { roomId: room1.id, senderId: charity1User.id, content: "Yes please! But no photos of families — only of volunteers working and general setup. We'll brief everyone on privacy guidelines.", createdAt: d(-32) },
      { roomId: room1.id, senderId: vol1.id, content: "Amazing day today! We served over 120 families. The new shelf organization system worked really well.", createdAt: d(-30) },
      { roomId: room1.id, senderId: charity1User.id, content: "Thank you both so much! Karim, Nadia — you were incredible. Certificates will be issued this week. Yalla see you next time!", createdAt: d(-30) },
    ],
  });

  // Room 2 — Karantina April (active)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room2.id, senderId: charity1User.id, content: "Marhaba Karim! You're confirmed for the April weekend shift. Same location as last time.", createdAt: d(-3) },
      { roomId: room2.id, senderId: vol1.id, content: "Perfect! Same time at 8am? I noticed last time we ran low on rice — should I check the inventory beforehand?", createdAt: d(-3) },
      { roomId: room2.id, senderId: charity1User.id, content: "That would be amazing actually. I'll give you warehouse access on Friday. We just received a big donation from a supermarket in Achrafieh.", createdAt: d(-2) },
    ],
  });

  // Room 3 — Scholarship interviews (closed)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room3.id, senderId: charity2User.id, content: "Welcome Lara! We have 45 students coming for interviews tomorrow. Your role is to guide them through the waiting area and help with forms.", createdAt: d(-16) },
      { roomId: room3.id, senderId: vol2.id, content: "Understood! Are the forms in Arabic or English?", createdAt: d(-16) },
      { roomId: room3.id, senderId: charity2User.id, content: "Both — we have bilingual versions. Some students from public schools may need help with the English sections.", createdAt: d(-15) },
      { roomId: room3.id, senderId: vol2.id, content: "Interview day went smoothly! Some really inspiring stories from the students. One girl walked 2 hours from Dahieh to get here.", createdAt: d(-14) },
      { roomId: room3.id, senderId: charity2User.id, content: "You were wonderful with them, Lara. Thank you so much. We'll send your certificate soon.", createdAt: d(-14) },
    ],
  });

  // Room 4 — University support (active)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room4.id, senderId: charity2User.id, content: "Hi Omar! Welcome to the university application support team. Sessions start April 20th at our Beirut center.", createdAt: d(-2) },
      { roomId: room4.id, senderId: vol3.id, content: "Looking forward to it! I've mentored many young people through this process. Any particular universities they're targeting?", createdAt: d(-2) },
      { roomId: room4.id, senderId: charity2User.id, content: "Mostly LAU, AUB, and the Lebanese University. Many of them are first-generation university applicants so they need a lot of guidance.", createdAt: d(-1) },
    ],
  });

  // Room 5 — Bekaa clinic (active)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room5.id, senderId: charity3User.id, content: "Ahla Maya! The clinic session is next Saturday in Zahle. We start at 7:30am because patients line up early.", createdAt: d(-2) },
      { roomId: room5.id, senderId: vol4.id, content: "I'll be there! Should I review any specific medication lists? As a pharmacy student I can help with dispensing.", createdAt: d(-2) },
      { roomId: room5.id, senderId: charity3User.id, content: "Yes — I'll send you the formulary. Most common needs are chronic disease medications: diabetes, hypertension, and antibiotics.", createdAt: d(-1) },
    ],
  });

  // Room 6 — Ramadan packing (active)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room6.id, senderId: charity4User.id, content: "Welcome team! Ramadan Mubarak to everyone. We're packing 500 parcels this Thursday at the Badaro warehouse.", createdAt: d(-2) },
      { roomId: room6.id, senderId: vol2.id, content: "Ramadan Kareem! I've done this before — should I bring extra tape for the boxes? Last time we ran out.", createdAt: d(-2) },
      { roomId: room6.id, senderId: charity4User.id, content: "Good memory Lara! Yes please bring some. Karim, you'll be on the loading team since you mentioned you can handle heavy lifting.", createdAt: d(-1) },
      { roomId: room6.id, senderId: vol1.id, content: "Sounds good! I'll bring a friend too — he's not on the platform yet but wants to help. Is that okay?", createdAt: d(-1) },
      { roomId: room6.id, senderId: charity4User.id, content: "Walk-ins are welcome! Just have him sign in at the front desk. The more hands the better.", createdAt: d(0) },
    ],
  });

  // Room 7 — Iftar distribution (active)
  await prisma.roomMessage.createMany({
    data: [
      { roomId: room7.id, senderId: charity4User.id, content: "Hi Omar! The Iftar distribution in Tariq El Jdideh is next week. We'll meet at the warehouse at 4pm and head out by 5pm.", createdAt: d(-1) },
      { roomId: room7.id, senderId: vol3.id, content: "I'll be there inshallah. I know the area well — some of the families I work with live there. I can help with navigation.", createdAt: d(-1) },
      { roomId: room7.id, senderId: charity4User.id, content: "That's incredibly helpful. We're delivering 200 hot meals. I'll pair you with our driver who covers the Corniche El Mazraa side.", createdAt: d(0) },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  RATINGS
  // ══════════════════════════════════════════════════════════
  console.log("  → Ratings");

  await prisma.volunteerRating.createMany({
    data: [
      {
        charityId: charity1.id, volunteerId: vol1.id, opportunityId: opp1.id,
        rating: 5,
        comment: "Karim was outstanding — arrived early, organized the entire rice and lentil section, and was incredibly respectful with families. A natural leader.",
      },
      {
        charityId: charity1.id, volunteerId: vol6.id, opportunityId: opp1.id,
        rating: 4,
        comment: "Nadia's photographs were beautiful and her help with families was genuine. Would love to have her back next month.",
      },
      {
        charityId: charity2.id, volunteerId: vol2.id, opportunityId: opp4.id,
        rating: 5,
        comment: "Lara went above and beyond — she calmed nervous students, helped with Arabic translations, and stayed an extra hour to help clean up.",
      },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  CERTIFICATES
  // ══════════════════════════════════════════════════════════
  console.log("  → Certificates");

  await prisma.certificate.createMany({
    data: [
      {
        volunteerId: vol1.id, opportunityId: opp1.id, charityId: charity1.id,
        certificateData: {
          volunteerName: "Karim Haddad", charityName: "Beit El Baraka",
          opportunityTitle: "Karantina Market Setup — March Shift",
          startDate: d(-30), endDate: d(-30), issuedAt: d(-28),
          verificationCode: "HL-2026-KH-001",
        },
      },
      {
        volunteerId: vol6.id, opportunityId: opp1.id, charityId: charity1.id,
        certificateData: {
          volunteerName: "Nadia Awad", charityName: "Beit El Baraka",
          opportunityTitle: "Karantina Market Setup — March Shift",
          startDate: d(-30), endDate: d(-30), issuedAt: d(-28),
          verificationCode: "HL-2026-NA-002",
        },
      },
      {
        volunteerId: vol2.id, opportunityId: opp4.id, charityId: charity2.id,
        certificateData: {
          volunteerName: "Lara Mouawad", charityName: "Nusaned",
          opportunityTitle: "Scholarship Interview Day — Beirut",
          startDate: d(-14), endDate: d(-14), issuedAt: d(-12),
          verificationCode: "HL-2026-LM-003",
        },
      },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  console.log("  → Notifications");

  await prisma.notification.createMany({
    data: [
      // Admin
      { userId: admin.id, title: "New Registration Request", message: "Himaya has submitted a registration request for review.", type: "INFO", isRead: false, link: "/requests" },
      { userId: admin.id, title: "Verification Request", message: "Himaya submitted verification documents including their MOI registration certificate.", type: "INFO", isRead: false, link: "/requests" },
      { userId: admin.id, title: "Registration Approved", message: "Beit El Baraka's registration was approved and charity account created.", type: "SUCCESS", isRead: true, link: "/charities" },
      { userId: admin.id, title: "Monthly Report Ready", message: "The March 2026 platform activity report is ready for review.", type: "INFO", isRead: true, link: "/reports" },

      // Volunteers
      { userId: vol1.id, title: "Application Approved!", message: "Your application for \"Karantina Market — April Weekend Volunteers\" has been approved. You've been added to the volunteer room.", type: "SUCCESS", isRead: false, link: "/opportunities/2/room" },
      { userId: vol1.id, title: "Certificate Issued!", message: "You've been issued a certificate for completing \"Karantina Market Setup — March Shift\" with Beit El Baraka.", type: "SUCCESS", isRead: true, link: "/certificates" },
      { userId: vol1.id, title: "You received a 5-star rating", message: "Beit El Baraka rated you 5/5 for \"Karantina Market Setup\". Comment: Karim was outstanding.", type: "INFO", isRead: false, link: "/profile" },
      { userId: vol2.id, title: "Application Approved!", message: "Your application for \"Ramadan Food Parcel Packing\" has been approved.", type: "SUCCESS", isRead: false, link: "/opportunities/7/room" },
      { userId: vol2.id, title: "Certificate Issued!", message: "You've been issued a certificate for \"Scholarship Interview Day\" with Nusaned.", type: "SUCCESS", isRead: true, link: "/certificates" },
      { userId: vol3.id, title: "Application Approved!", message: "Your application for \"University Application Support Sessions\" has been approved.", type: "SUCCESS", isRead: false, link: "/opportunities/5/room" },
      { userId: vol4.id, title: "Application Approved!", message: "Your application for \"Bekaa Health Clinic — Zahle Session\" has been approved.", type: "SUCCESS", isRead: false, link: "/opportunities/6/room" },
      { userId: vol5.id, title: "Application Declined", message: "Your application for \"Child Safety Workshop — School Training\" has been declined.", type: "WARNING", isRead: false, link: "/opportunities/9" },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  REGISTRATION REQUESTS
  // ══════════════════════════════════════════════════════════
  console.log("  → Registration requests");

  await prisma.registrationRequest.createMany({
    data: [
      {
        status: "PENDING", name: "Basmeh & Zeitooneh", email: "info@basmeh-zeitooneh.org",
        phone: "+961 1 555 111", city: "Beirut", category: "SOCIAL",
        message: "We are a Lebanese NGO operating community centers in Shatila and Bourj el-Barajneh serving displaced communities with education, livelihood support, and relief.",
      },
      {
        status: "PENDING", name: "Teach For Lebanon", email: "apply@teachforlebanon.org",
        phone: "+961 1 555 222", city: "Beirut", category: "EDUCATION",
        message: "We recruit and train university graduates to teach in under-resourced schools across Lebanon for two years. Seeking platform access to recruit teaching volunteers.",
      },
      {
        status: "APPROVED", name: "Beit El Baraka", email: "info@beitelbaraka.org",
        phone: "+961 1 123 456", city: "Beirut", category: "SOCIAL",
        message: "Dignity-based free supermarket serving families affected by the economic crisis.",
        reviewedBy: admin.id, reviewedAt: d(-90),
        reviewNote: "Well-known Lebanese initiative. Registration in order. Approved.",
      },
      {
        status: "DECLINED", name: "Quick Relief LB", email: "admin@quickrelief.lb",
        phone: "+961 70 999 888", city: "Beirut", category: "OTHER",
        message: "We provide cash assistance to families.",
        reviewedBy: admin.id, reviewedAt: d(-60),
        reviewNote: "No verifiable registration with the Ministry of Interior. No documentation of fund allocation. Application declined.",
      },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  VERIFICATION REQUESTS
  // ══════════════════════════════════════════════════════════
  console.log("  → Verification requests");

  await prisma.verificationRequest.createMany({
    data: [
      {
        status: "PENDING", userId: charity5User.id,
        documents: ["https://storage.example.com/docs/himaya-moi-cert.pdf", "https://storage.example.com/docs/himaya-annual-report-2025.pdf"],
        message: "Submitting our Ministry of Interior registration certificate and 2025 annual report for platform verification.",
      },
      {
        status: "APPROVED", userId: charity1User.id,
        documents: ["https://storage.example.com/docs/beitelbaraka-moi.pdf", "https://storage.example.com/docs/beitelbaraka-financials-2025.pdf"],
        message: "MOI registration and audited financials attached.",
        reviewedBy: admin.id, reviewedAt: d(-85),
        reviewNote: "All documents verified with MOI database. Financial records are transparent. Approved.",
      },
      {
        status: "APPROVED", userId: charity3User.id,
        documents: ["https://storage.example.com/docs/arcenciel-moi.pdf", "https://storage.example.com/docs/arcenciel-board-resolution.pdf", "https://storage.example.com/docs/arcenciel-audit-2025.pdf"],
        message: "Full documentation package including board resolution and external audit.",
        reviewedBy: admin.id, reviewedAt: d(-80),
        reviewNote: "Arcenciel is one of the most established NGOs in Lebanon. Documentation thorough and verified.",
      },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  AUDIT LOGS
  // ══════════════════════════════════════════════════════════
  console.log("  → Audit logs");

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "APPROVE_REGISTRATION", target: "Beit El Baraka", targetType: "RegistrationRequest", details: "Registration approved. Charity account created with temporary credentials.", ipAddress: "185.107.56.12" },
      { userId: admin.id, action: "APPROVE_VERIFICATION", target: "Beit El Baraka", targetType: "VerificationRequest", details: "Verification approved. MOI certificate and financials confirmed.", ipAddress: "185.107.56.12" },
      { userId: admin.id, action: "APPROVE_VERIFICATION", target: "Arcenciel", targetType: "VerificationRequest", details: "Verification approved. Full documentation package verified.", ipAddress: "185.107.56.12" },
      { userId: admin.id, action: "DECLINE_REGISTRATION", target: "Quick Relief LB", targetType: "RegistrationRequest", details: "Declined — no MOI registration, no fund allocation documentation.", ipAddress: "185.107.56.12" },
      { userId: admin.id, action: "UPDATE_SETTINGS", target: "platform_name", targetType: "PlatformSetting", details: "Changed platform name to Hope Link.", ipAddress: "185.107.56.12" },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  PLATFORM SETTINGS
  // ══════════════════════════════════════════════════════════
  console.log("  → Platform settings");

  await prisma.platformSetting.createMany({
    data: [
      { key: "platform_name", value: "Hope Link" },
      { key: "platform_email", value: "support@hopelink.org" },
      { key: "max_file_size_mb", value: "10" },
      { key: "allow_public_registration", value: "true" },
      { key: "require_charity_verification", value: "true" },
      { key: "maintenance_mode", value: "false" },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  EMAIL TEMPLATES
  // ══════════════════════════════════════════════════════════
  console.log("  → Email templates");

  await prisma.emailTemplate.createMany({
    data: [
      {
        key: "registration_approved", name: "Registration Approved",
        description: "Sent to charities when their registration is approved.",
        subject: "Welcome to Hope Link — Your registration has been approved!",
        body: "Dear {{name}},\n\nWe are pleased to inform you that your registration on Hope Link has been approved. You can now log in, complete your profile, and start posting volunteering opportunities.\n\nIf you have any questions, please contact us at support@hopelink.org.\n\nThank you for joining the Hope Link community.\n\nBest regards,\nThe Hope Link Team",
        variables: ["name"],
      },
      {
        key: "registration_declined", name: "Registration Declined",
        description: "Sent when a registration request is declined.",
        subject: "Update on your Hope Link registration",
        body: "Dear {{name}},\n\nThank you for your interest in Hope Link. After reviewing your registration request, we are unable to approve it at this time.\n\nReason: {{reason}}\n\nYou are welcome to reapply once the above concerns have been addressed. If you believe this was an error, please contact support@hopelink.org.\n\nBest regards,\nThe Hope Link Team",
        variables: ["name", "reason"],
      },
      {
        key: "verification_approved", name: "Verification Approved",
        description: "Sent when a charity is verified.",
        subject: "Your charity is now verified on Hope Link!",
        body: "Dear {{name}},\n\nGreat news! Your charity has been verified on Hope Link. A verified badge will now appear on your profile, building trust with volunteers across Lebanon.\n\nBest regards,\nThe Hope Link Team",
        variables: ["name"],
      },
      {
        key: "application_approved", name: "Application Approved",
        description: "Sent to volunteers when their application is approved.",
        subject: "You're in! Application approved for {{opportunityTitle}}",
        body: "Dear {{volunteerName}},\n\nYour application for \"{{opportunityTitle}}\" has been approved! You have been added to the volunteer room where you can coordinate with the charity team.\n\nSee you there!\nThe Hope Link Team",
        variables: ["volunteerName", "opportunityTitle"],
      },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  COMMUNITY POSTS
  // ══════════════════════════════════════════════════════════
  console.log("  → Community posts");

  const post1 = await prisma.post.create({
    data: {
      authorId: vol1.id,
      postType: "CERTIFICATE",
      content: "Just received my certificate for completing the Karantina Community Market volunteer program! 🎉 Truly humbling to work alongside such dedicated people. Helping families access food with dignity is something I'll carry with me forever. If you're looking for a meaningful way to give back in Beirut, I can't recommend Beit El Baraka enough. #HopeLink #Volunteering #Beirut",
      imageUrl: "https://picsum.photos/seed/cert1/800/400",
      createdAt: d(-3),
      updatedAt: d(-3),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: charity1User.id,
      postType: "PROJECT",
      content: "Week 4 update on the Karantina Community Market project! 🛒\n\nThis week we welcomed 87 new families to the free supermarket, bringing our total to over 1,200 registered families since the project launched. Our volunteer team has been incredible — sorting, stocking shelves, and greeting every family with warmth.\n\nWe're still looking for volunteers for Saturday morning shifts. Apply now through Hope Link!",
      imageUrl: "https://picsum.photos/seed/market1/800/450",
      createdAt: d(-5),
      updatedAt: d(-5),
    },
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: vol2.id,
      postType: "GENERAL",
      content: "Spent Saturday at the Lebanese Food Bank sorting and packing Ramadan food parcels. We packed over 300 parcels in 4 hours as a team — it always amazes me what a group of motivated volunteers can achieve together. Grateful to be part of this community. 🌙",
      imageUrl: "https://picsum.photos/seed/foodbank1/800/420",
      createdAt: d(-7),
      updatedAt: d(-7),
    },
  });

  const post4 = await prisma.post.create({
    data: {
      authorId: charity4User.id,
      postType: "PROJECT",
      content: "Ramadan Food Drive 2026 — Day 3 Update 🌙\n\nAlhamdulillah, we've already collected over 2,000 food parcels across our 5 collection points in Beirut, Tripoli, and Sidon. Each parcel feeds a family for a week.\n\nA huge thank you to every volunteer who has given their time this week. We couldn't do this without you. Join us — every hour counts. Register on Hope Link today.",
      imageUrl: null,
      createdAt: d(-2),
      updatedAt: d(-2),
    },
  });

  const post5 = await prisma.post.create({
    data: {
      authorId: vol3.id,
      postType: "GENERAL",
      content: "After 4 years of social work in Tripoli, I've learned that the most powerful thing you can give someone isn't food or money — it's the feeling that someone sees them and cares. Volunteering has changed how I see the world. If you're on the fence about signing up, just do it. The families you'll meet will change your life.",
      imageUrl: null,
      createdAt: d(-10),
      updatedAt: d(-10),
    },
  });

  const post6 = await prisma.post.create({
    data: {
      authorId: vol6.id,
      postType: "GENERAL",
      content: "Just finished designing the new awareness campaign visuals for Beit El Baraka's winter drive. Volunteering my design skills feels so much more meaningful than client work — you can see the impact directly. Happy to connect with other creatives who want to contribute to NGOs in Lebanon! 🎨",
      imageUrl: "https://picsum.photos/seed/design1/800/430",
      createdAt: d(-6),
      updatedAt: d(-6),
    },
  });

  const post7 = await prisma.post.create({
    data: {
      authorId: charity3User.id,
      postType: "PROJECT",
      content: "Our Bekaa Mobile Health Clinic completed its 12th session this month ✅\n\nBy the numbers:\n• 340 consultations\n• 180 vaccinations administered\n• 5 villages visited\n• 12 volunteer medical staff\n\nThank you to our incredible team of volunteer doctors, nurses, and pharmacists. Applications are open for the next rotation — health professionals welcome!",
      imageUrl: "https://picsum.photos/seed/clinic1/800/450",
      createdAt: d(-4),
      updatedAt: d(-4),
    },
  });

  const post8 = await prisma.post.create({
    data: {
      authorId: vol4.id,
      postType: "CERTIFICATE",
      content: "Received my volunteer certificate from Arcenciel for the Bekaa Mobile Clinic rotation! This was my first medical volunteering experience and it surpassed every expectation. Watching patients receive care they couldn't otherwise access — I'm more motivated than ever to continue. Next stop: applying for the summer rotation! 💙",
      imageUrl: null,
      createdAt: d(-1),
      updatedAt: d(-1),
    },
  });

  // ── Likes ────────────────────────────────────────────────
  await prisma.postLike.createMany({
    data: [
      { postId: post1.id, userId: vol2.id },
      { postId: post1.id, userId: vol3.id },
      { postId: post1.id, userId: vol5.id },
      { postId: post1.id, userId: charity1User.id },
      { postId: post2.id, userId: vol1.id },
      { postId: post2.id, userId: vol2.id },
      { postId: post2.id, userId: vol4.id },
      { postId: post2.id, userId: vol6.id },
      { postId: post2.id, userId: vol3.id },
      { postId: post3.id, userId: vol1.id },
      { postId: post3.id, userId: vol4.id },
      { postId: post3.id, userId: charity4User.id },
      { postId: post4.id, userId: vol2.id },
      { postId: post4.id, userId: vol3.id },
      { postId: post4.id, userId: vol5.id },
      { postId: post5.id, userId: vol1.id },
      { postId: post5.id, userId: vol4.id },
      { postId: post5.id, userId: vol6.id },
      { postId: post5.id, userId: charity2User.id },
      { postId: post6.id, userId: vol1.id },
      { postId: post6.id, userId: vol2.id },
      { postId: post6.id, userId: charity1User.id },
      { postId: post7.id, userId: vol1.id },
      { postId: post7.id, userId: vol2.id },
      { postId: post7.id, userId: vol4.id },
      { postId: post7.id, userId: vol5.id },
      { postId: post8.id, userId: vol1.id },
      { postId: post8.id, userId: vol2.id },
      { postId: post8.id, userId: vol3.id },
      { postId: post8.id, userId: charity3User.id },
    ],
  });

  // ── Comments ──────────────────────────────────────────────
  await prisma.postComment.createMany({
    data: [
      { postId: post1.id, authorId: vol2.id,        content: "Congratulations Karim! Beit El Baraka is such an inspiring organization. You should be proud! 💪", createdAt: d(-3), updatedAt: d(-3) },
      { postId: post1.id, authorId: charity1User.id, content: "It was an honor to have you with us, Karim. Your energy and dedication made a real difference for our families. Thank you!", createdAt: d(-3), updatedAt: d(-3) },
      { postId: post1.id, authorId: vol5.id,         content: "This is so inspiring. I just applied through Hope Link after reading this post!", createdAt: d(-2), updatedAt: d(-2) },
      { postId: post2.id, authorId: vol1.id,         content: "Signed up for next Saturday's shift! Can't wait to contribute.", createdAt: d(-5), updatedAt: d(-5) },
      { postId: post2.id, authorId: vol6.id,         content: "Would love to help with any marketing or social media you need — just message me!", createdAt: d(-4), updatedAt: d(-4) },
      { postId: post3.id, authorId: vol3.id,         content: "300 parcels in 4 hours is incredible teamwork. The Ramadan drive is one of the most impactful things I've seen.", createdAt: d(-7), updatedAt: d(-7) },
      { postId: post3.id, authorId: charity4User.id, content: "Thank you Lara — your commitment every single week means so much to our team and to the families we serve. 🌙", createdAt: d(-6), updatedAt: d(-6) },
      { postId: post5.id, authorId: vol1.id,         content: "This is exactly why I started volunteering. Thank you for putting it into words, Omar.", createdAt: d(-9), updatedAt: d(-9) },
      { postId: post5.id, authorId: vol4.id,         content: "4 years is remarkable. Your experience is such a resource for newer volunteers like me.", createdAt: d(-9), updatedAt: d(-9) },
      { postId: post6.id, authorId: vol4.id,         content: "Your designs are amazing, Nadia! Would love to see the full campaign when it launches.", createdAt: d(-6), updatedAt: d(-6) },
      { postId: post7.id, authorId: vol2.id,         content: "These numbers are incredible. 340 consultations in one month! Healthcare access is so critical right now.", createdAt: d(-4), updatedAt: d(-4) },
      { postId: post7.id, authorId: vol4.id,         content: "Already applying for the next rotation! This is exactly the kind of work I've been looking to join.", createdAt: d(-3), updatedAt: d(-3) },
      { postId: post8.id, authorId: vol2.id,         content: "Congratulations Maya! Healthcare volunteering is so meaningful. Proud of you!", createdAt: d(-1), updatedAt: d(-1) },
      { postId: post8.id, authorId: charity3User.id, content: "Maya was an exceptional volunteer. We look forward to welcoming her back for the summer rotation! 🌟", createdAt: d(-1), updatedAt: d(-1) },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  INTEGRATIONS
  // ══════════════════════════════════════════════════════════
  console.log("  → Integrations");

  await prisma.integration.createMany({
    data: [
      { name: "WhatsApp Business", description: "Send volunteer notifications and reminders via WhatsApp", icon: "whatsapp", status: "disconnected", config: "{}" },
      { name: "Google Calendar", description: "Sync opportunity dates with Google Calendar", icon: "google-calendar", status: "disconnected", config: "{}" },
      { name: "Brevo (Sendinblue)", description: "Send transactional and marketing emails through Brevo", icon: "brevo", status: "disconnected", config: "{}" },
      { name: "Stripe", description: "Accept donations via Stripe payment processing", icon: "stripe", status: "disconnected", config: "{}" },
    ],
  });

  // ══════════════════════════════════════════════════════════
  //  DONE
  // ══════════════════════════════════════════════════════════
  console.log("\n✅ Seeding complete!\n");
  console.log("  ┌─────────────────────────────────────────────────────────────────────┐");
  console.log("  │  All accounts use password: Password123!                            │");
  console.log("  ├─────────────────────────────────────────────────────────────────────┤");
  console.log("  │  COMMUNITY FEED: 8 posts, 30 likes, 14 comments seeded             │");
  console.log("  ├─────────────────────────────────────────────────────────────────────┤");
  console.log("  │  ADMIN                                                              │");
  console.log("  │    admin@hopelink.org              Mohammad Houda                      │");
  console.log("  │                                                                     │");
  console.log("  │  CHARITIES                                                          │");
  console.log("  │    info@beitelbaraka.org           Beit El Baraka (verified)        │");
  console.log("  │    contact@nusaned.org             Nusaned (verified)               │");
  console.log("  │    info@arcenciel.org              Arcenciel (verified)             │");
  console.log("  │    hello@lebfoodbank.org           Lebanese Food Bank (verified)    │");
  console.log("  │    contact@himaya.org              Himaya (unverified)              │");
  console.log("  │                                                                     │");
  console.log("  │  VOLUNTEERS                                                         │");
  console.log("  │    karim.haddad@gmail.com          Karim Haddad (Beirut, verified)  │");
  console.log("  │    lara.mouawad@gmail.com          Lara Mouawad (Jounieh, verified) │");
  console.log("  │    omar.darwish@gmail.com          Omar Darwish (Tripoli, verified) │");
  console.log("  │    maya.sarkis@gmail.com           Maya Sarkis (Zahle, unverified)  │");
  console.log("  │    rami.najjar@gmail.com           Rami Najjar (Sidon, verified)    │");
  console.log("  │    nadia.awad@gmail.com            Nadia Awad (Beirut, unverified)  │");
  console.log("  └─────────────────────────────────────────────────────────────────────┘\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());