import { db } from "@/lib/db"
import { approveUser, rejectUser } from "@/app/actions/admin"
import { UserManagementTable } from "./users-table"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic" // Always fetch fresh data on every request

export default async function AdminPage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    // Pending = not approved AND not already rejected
    const pendingUsers = await db.user.findMany({
        where: {
            approved: false,
            rejected: false,
            role: "USER", // don't show admins as pending
        },
        orderBy: { createdAt: "desc" },
    })

    // All non-admin users for the full management table
    const allUsers = await db.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="container mx-auto py-10 px-4">
            {/* Header */}
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

            {/* ── Pending Approvals Section ── */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Pending Approvals
                    </h2>
                    {pendingUsers.length > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                            {pendingUsers.length}
                        </span>
                    )}
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        ✅ No pending approval requests.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {pendingUsers.map((user) => (
                            <li key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{user.name || "—"}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Registered: {new Date(user.createdAt).toLocaleString()}
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

            {/* ── All Users Management Table ── */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    All Users ({allUsers.length})
                </h2>
                <UserManagementTable users={allUsers} />
            </div>

            {/* ── Available Tools ── */}
            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Available Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer group">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">YouTube AI Summarizer</h3>
                        <p className="text-gray-600 mt-2 mb-4">
                            Generate clean study notes and summaries from YouTube videos using AI.
                        </p>
                        <a href="/dashboard/tools/youtube-summarizer" className="text-indigo-600 font-medium hover:underline">
                            Open Tool &rarr;
                        </a>
                    </div>

                    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition cursor-pointer group">
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600">Document Q&A</h3>
                        <p className="text-gray-600 mt-2 mb-4">
                            Upload PDFs or text files and ask questions to get AI-generated answers.
                        </p>
                        <a href="/dashboard/documents" className="text-indigo-600 font-medium hover:underline">
                            Open Tool &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
