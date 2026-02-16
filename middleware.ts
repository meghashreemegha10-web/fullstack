import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // req.auth is the session
})

export const config = {
    // Protect all routes except API routes, static files, and Next.js internals
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
