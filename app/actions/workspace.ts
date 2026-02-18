'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
})

export async function createWorkspace(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const validatedFields = createWorkspaceSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description"),
    })

    if (!validatedFields.success) {
        throw new Error("Invalid fields")
    }

    const { name, description } = validatedFields.data

    try {
        await db.workspace.create({
            data: {
                name,
                description,
                userId: session.user.id,
            },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to create workspace:", error)
        return { error: "Failed to create workspace" }
    }
}

export async function getWorkspaces() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    try {
        const workspaces = await db.workspace.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: { documents: true }
                }
            }
        })
        return workspaces
    } catch (error) {
        console.error("Failed to fetch workspaces:", error)
        return []
    }
}

export async function deleteWorkspace(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    try {
        // Ensure the workspace belongs to the user
        const workspace = await db.workspace.findUnique({
            where: { id },
        })

        if (!workspace || workspace.userId !== session.user.id) {
            throw new Error("Unauthorized or not found")
        }

        await db.workspace.delete({
            where: { id },
        })
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete workspace:", error)
        return { error: "Failed to delete workspace" }
    }
}
