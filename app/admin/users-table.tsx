"use client"

import { approveUser, rejectUser, changeRole } from "@/app/actions/admin"
import { Role } from "@prisma/client"
import { useState, useTransition } from "react"

interface User {
    id: string
    name: string | null
    email: string
    role: Role
    approved: boolean
    createdAt: Date
}

export function UserManagementTable({ users }: { users: User[] }) {
    const [isPending, startTransition] = useTransition()
    const [roleMap, setRoleMap] = useState<Record<string, Role>>({})

    const handleApprove = (id: string) => {
        startTransition(() => {
            approveUser(id)
        })
    }

    const handleReject = (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            startTransition(() => {
                rejectUser(id)
            })
        }
    }

    const handleRoleChange = (id: string, newRole: Role) => {
        setRoleMap(prev => ({ ...prev, [id]: newRole }))
        startTransition(() => {
            changeRole(id, newRole)
        })
    }

    return (
        <div className="overflow-x-auto rounded-lg border shadow">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b bg-white hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {user.name || "N/A"}
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">
                                <select
                                    disabled={isPending}
                                    value={roleMap[user.id] || user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 border p-1"
                                >
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                {user.approved ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                        Approved
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                        Pending
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 space-x-2">
                                {!user.approved && (
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        disabled={isPending}
                                        className="font-medium text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleReject(user.id)}
                                    disabled={isPending}
                                    className="font-medium text-red-600 hover:underline disabled:opacity-50"
                                >
                                    Reject/Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-4">No users found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
