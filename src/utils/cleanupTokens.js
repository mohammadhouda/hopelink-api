import prisma from "../config/prisma.js";


export async function cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
        where: {
            isRevoked: true,
        }
    });
    console.log(`Cleaned up ${result.count} expired refresh tokens.`);
    return result.count;
}  