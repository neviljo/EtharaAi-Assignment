require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned old records.");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  // 1. Create Users
  const userAdmin = await prisma.user.create({
    data: {
      name: "Alex Mercer",
      email: "admin@company.com",
      password: hashedPassword,
    },
  });

  const userMember = await prisma.user.create({
    data: {
      name: "Chloe Zhao",
      email: "member@company.com",
      password: hashedPassword,
    },
  });

  const userDev = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: "developer@company.com",
      password: hashedPassword,
    },
  });

  console.log(`Created 3 users: ${userAdmin.email}, ${userMember.email}, ${userDev.email}`);

  // 2. Create Project
  const project = await prisma.project.create({
    data: {
      name: "Aetheria Portal Redesign",
      description: "Complete overhaul of the core web client to support dark mode, responsive boards, and real-time JWT workflows.",
    },
  });

  console.log(`Created project: "${project.name}"`);

  // 3. Create Project Memberships (Roles)
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: userAdmin.id,
      role: "ADMIN",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: userMember.id,
      role: "MEMBER",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: userDev.id,
      role: "MEMBER",
    },
  });

  console.log("Assigned roles: Alex (Admin), Chloe (Member), Marcus (Member)");

  // 4. Create Tasks
  
  // Task 1: Done
  const taskDone = await prisma.task.create({
    data: {
      title: "Define global CSS variables and theme layouts",
      description: "Establish variables for glassmorphic cards, Outfit typography, gradients, animations, and radial chart assets in globals.css.",
      status: "DONE",
      priority: "HIGH",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      projectId: project.id,
      assigneeId: userAdmin.id,
      creatorId: userAdmin.id,
    },
  });

  // Task 2: In Review
  const taskReview = await prisma.task.create({
    data: {
      title: "Enforce JWT authentication cookies on API router",
      description: "Configure cookie-setting in login endpoint and extraction middleware in api/auth/me to verify signatures and payload.",
      status: "IN_REVIEW",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      projectId: project.id,
      assigneeId: userAdmin.id,
      creatorId: userAdmin.id,
    },
  });

  // Task 3: In Progress
  const taskProgress = await prisma.task.create({
    data: {
      title: "Build custom circular SVG progress chart",
      description: "Write React logic to dynamically compute strokeDashoffset in ProjectStats component using radial values rather than canvas dependencies.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      projectId: project.id,
      assigneeId: userMember.id,
      creatorId: userAdmin.id,
    },
  });

  // Task 4: To Do
  const taskTodo = await prisma.task.create({
    data: {
      title: "Write database seed script and verification plan",
      description: "Construct node prisma/seed.js module to establish sample datasets and plan step-by-step verification procedures for manual validation.",
      status: "TODO",
      priority: "LOW",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      projectId: project.id,
      assigneeId: userDev.id,
      creatorId: userAdmin.id,
    },
  });

  // Task 5: Overdue Task
  const taskOverdue = await prisma.task.create({
    data: {
      title: "Review mockups and assets for initial deployment",
      description: "Critique Figma mockups and ensure build output runs cleanly without warning messages or missing package references.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (OVERDUE!)
      projectId: project.id,
      assigneeId: userMember.id,
      creatorId: userAdmin.id,
    },
  });

  console.log("Created 5 sample tasks (including 1 Done, 1 In Review, 1 In Progress, 1 To Do, and 1 Overdue)");

  // 5. Create Comments
  await prisma.comment.create({
    data: {
      content: "I have loaded the Outfit font from Google Fonts and standard gradients are working nicely. Card animations feel premium.",
      taskId: taskDone.id,
      userId: userAdmin.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Excellent! The layout renders beautifully on mobile as well.",
      taskId: taskDone.id,
      userId: userMember.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "I am having some difficulty alignment on the radial track. Will look into mathematical formula for dashoffset.",
      taskId: taskProgress.id,
      userId: userMember.id,
    },
  });

  console.log("Added 3 starter comments.");
  console.log("Database seeded successfully! Try logging in as admin@company.com with password 'password123'.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
