import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prismaOptions = {};

if (process.env.DATABASE_URL) {
  prismaOptions.accelerateUrl = process.env.DATABASE_URL;
}

export const db = globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
