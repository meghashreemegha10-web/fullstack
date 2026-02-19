"use server"

import * as z from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { LoginSchema, RegisterSchema } from "@/lib/schemas"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Invalid fields!" }
    }

    const { email, password } = validatedFields.data

    // Check user status BEFORE signing in so we can return proper error messages.
    // We cannot rely on throwing inside authorize() because NextAuth v5 wraps that
    // in a CallbackRouteError in production, making it unreliable.
    const user = await db.user.findUnique({ where: { email } })
    if (user) {
        const passwordsMatch = await bcrypt.compare(password, user.password || "")
        if (passwordsMatch) {
            if ((user as any).rejected) {
                return { error: "Your account has been rejected." }
            }
            if (!user.approved) {
                return { error: "Your account is waiting for admin approval." }
            }
        }
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        // NEXT-AUTH redirects by throwing a NEXT_REDIRECT — rethrow it
        throw error
    }
}

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Invalid fields!" }
    }

    const { email, password, name } = validatedFields.data
    const hashedPassword = await bcrypt.hash(password, 10)

    const existingUser = await db.user.findUnique({
        where: {
            email,
        },
    })

    if (existingUser) {
        return { error: "Email already in use!" }
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "USER", // Default role
            approved: false, // Explicitly false
        },
    })

    return { success: "User created! Please login." }
}
