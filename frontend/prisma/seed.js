require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const badges = [
  {
    name: "task10",
    description: "Completed 10 tasks",
    icon_url: "/medals/task10.png",
  },
  {
    name: "task20",
    description: "Completed 20 tasks",
    icon_url: "/medals/task20.png",
  },
  {
    name: "task40",
    description: "Completed 40 or more tasks",
    icon_url: "/medals/task40.png",
  },
  {
    name: "backlog",
    description: "Created 20 or more tasks",
    icon_url: "/medals/backlog.png",
  },
  {
    name: "bug",
    description: "Closed 20 or more bug issues",
    icon_url: "/medals/bug.png",
  },
  {
    name: "sprint1",
    description: "Participated in 1 sprint",
    icon_url: "/medals/sprint1.png",
  },
  {
    name: "sprint5",
    description: "Participated in 5 sprints",
    icon_url: "/medals/sprint5.png",
  },
  {
    name: "sprint10",
    description: "Participated in 10 sprints",
    icon_url: "/medals/sprint10.png",
  },
  {
    name: "all_tasks",
    description: "Your team completed all sprint tasks",
    icon_url: "/medals/all_tasks.png",
  },
  {
    name: "recognition_innovation",
    description: "Recognized for innovation by a team member",
    icon_url: "/recognition/r_innovation.png",
  },
  {
    name: "recognition_leadership",
    description: "Recognized for leadership by a team member",
    icon_url: "/recognition/r_leadership.png",
  },
  {
    name: "recognition_teamwork",
    description: "Recognized for teamwork by a team member",
    icon_url: "/recognition/r_teamwork.png",
  },
];

async function main() {
  console.log("Seeding badges...");
  for (const badge of badges) {
    await prisma.badges.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`Seeded ${badges.length} badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
