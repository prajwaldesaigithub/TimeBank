

// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

let prismaClient: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: ["warn", "error"], // reduce noise; add "query" for debugging
    });
  }
  return prismaClient;
}
