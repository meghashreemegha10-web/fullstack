import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            if (isOnDashboard || isOnAdmin) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect authenticated users to dashboard
                // return Response.redirect(new URL("/dashboard", nextUrl))
                // Logic handled in middleware for redirection
            }
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.approved = user.approved
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role
                session.user.approved = token.approved
            }
            return session
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
