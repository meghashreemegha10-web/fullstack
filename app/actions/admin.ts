"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

export async function approveUser(userId: string) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await db.user.update({
        where: { id: userId },
        data: { approved: true },
    })

    revalidatePath("/admin")
}

export async function rejectUser(userId: string) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await db.user.update({
        where: { id: userId },
        data: {
            approved: false,
            rejected: true
        },
    })

    revalidatePath("/admin")
}

export async function changeRole(userId: string, role: Role) {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await db.user.update({
        where: { id: userId },
        data: { role },
    })

    revalidatePath("/admin")
}
