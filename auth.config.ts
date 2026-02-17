import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
        newUser: "/register", // Redirect to register if new user
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            if (isOnAdmin) {
                // @ts-ignore
                if (isLoggedIn && auth.user.role === "ADMIN") return true
                return false // Redirect unauthenticated or non-admin users
            }

            if (isOnDashboard) {
                // ALLOW GUESTS: Return true even if not logged in
                return true
            }

            if (isLoggedIn) {
                if (nextUrl.pathname === "/login" || nextUrl.pathname === "/register") {
                    // @ts-ignore
                    if (auth.user.role === "ADMIN") {
                        return Response.redirect(new URL("/admin", nextUrl))
                    }
                    // @ts-ignore
                    if (auth.user.approved) {
                        return Response.redirect(new URL("/dashboard", nextUrl))
                    }
                    return Response.redirect(new URL("/pending", nextUrl))
                }
            }
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.approved = (user as any).approved
                token.id = user.id
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).approved = token.approved;
                session.user.id = token.sub as string;
            }
            return session
        }
    },
    providers: [],
} satisfies NextAuthConfig
