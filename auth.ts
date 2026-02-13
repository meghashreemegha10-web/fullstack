import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { db } from "./lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await db.user.findUnique({ where: { email } })
                    if (!user) return null

                    const passwordsMatch = await bcrypt.compare(password, user.password || "")
                    if (passwordsMatch) {
                        // @ts-ignore
                        if (user.rejected) {
                            throw new Error("Account rejected.")
                        }
                        if (!user.approved) {
                            throw new Error("Account waiting for approval.")
                        }
                        return user
                    }
                }

                console.log("Invalid credentials")
                return null
            },
        }),
    ],
})
