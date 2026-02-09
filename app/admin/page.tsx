import { db } from "@/lib/db"
import { UserManagementTable } from "@/app/admin/users-table"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await db.user.findMany({
        orderBy: { createdAt: "desc" },
    })

    // Serialize dates if needed, but Server Components can pass Date objects to Client Components in Next.js 13+ (usually).
    // However, pure Date objects in props might trigger warnings in some versions. safe to pass.

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-6xl space-y-8">
                <header className="flex items-center justify-between border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage users and access.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Admin: {session?.user?.email}</span>
                        <form
                            action={async () => {
                                "use server"
                                await signOut()
                            }}
                        >
                            <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </header>

                <section className="bg-white p-6 rounded-lg shadow">
                    <UserManagementTable users={users} />
                </section>
            </div>
        </div>
    )
}
