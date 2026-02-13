import { db } from "@/lib/db"
import { approveUser, rejectUser } from "@/app/actions/admin"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    const pendingUsers = await db.user.findMany({
        where: {
            approved: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Welcome, {session.user.name}
                    </div>
                    <form
                        action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/" })
                        }}
                    >
                        <button type="submit" className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Pending Approvals ({pendingUsers.length})</h2>
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        No pending users found.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {pendingUsers.map((user) => (
                            <li key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <form action={async () => {
                                        "use server"
                                        await approveUser(user.id)
                                    }}>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            Approve
                                        </button>
                                    </form>

                                    <form action={async () => {
                                        "use server"
                                        await rejectUser(user.id)
                                    }}>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Reject
                                        </button>
                                    </form>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
