import { jest } from "@jest/globals";
import { mockDeep } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

// Single deep mock shared across all tests.
const prisma = mockDeep(PrismaClient);

export default prisma;
