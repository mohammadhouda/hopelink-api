import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export async function getProfileService(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
    });
    if (!user) throw new Error("User not found");
    return user;
}

export async function updateProfileService(userId, updatedData) {
    const dataToUpdate = {};

    if (updatedData.name) {
        dataToUpdate.name = updatedData.name;
    }

    if (updatedData.email) {
        dataToUpdate.email = updatedData.email;
    }

    if (updatedData.password) {
        dataToUpdate.password = await bcrypt.hash(updatedData.password, 10);
    }
    
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
}