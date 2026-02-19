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
                        // Return user with status fields — do NOT throw here.
                        // Throwing inside authorize() causes a CallbackRouteError in
                        // production (NextAuth v5) that swallows the real error message.
                        // The login action checks these flags and returns the right message.
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: (user as any).role,
                            approved: user.approved,
                            rejected: (user as any).rejected ?? false,
                        }
                    }
                }

                console.log("Invalid credentials")
                return null
            },
        }),
    ],
})
