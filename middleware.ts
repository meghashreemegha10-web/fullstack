import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // req.auth is the session
})

export const config = {
    // Exclude /api/summarize from NextAuth middleware
    matcher: [
        "/((?!.+\\.[\\w]+$|_next).*)",
        "/",
        "/(api|trpc)(?!/summarize)(.*)"
    ],
}
