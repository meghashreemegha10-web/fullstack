"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

export const approveUser = async (userId: string) => {
    try {
        await db.user.update({
            where: { id: userId },
            data: { approved: true },
        })
        revalidatePath("/admin")
        return { success: "User approved!" }
    } catch (error) {
        return { error: "Failed to approve user." }
    }
}

export const rejectUser = async (userId: string) => {
    try {
        await db.user.delete({
            where: { id: userId },
        })
        revalidatePath("/admin")
        return { success: "User rejected/deleted!" }
    } catch (error) {
        return { error: "Failed to reject user." }
    }
}

export const changeRole = async (userId: string, role: Role) => {
    try {
        await db.user.update({
            where: { id: userId },
            data: { role },
        })
        revalidatePath("/admin")
        return { success: "Role updated!" }
    } catch (error) {
        return { error: "Failed to update role." }
    }
}
