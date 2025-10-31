"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
// src/lib/prisma.ts
const client_1 = require("@prisma/client");
let prismaClient;
function getPrisma() {
    if (!prismaClient) {
        prismaClient = new client_1.PrismaClient({
            log: ["warn", "error"], // reduce noise; add "query" for debugging
        });
    }
    return prismaClient;
}
//# sourceMappingURL=prisma.js.map