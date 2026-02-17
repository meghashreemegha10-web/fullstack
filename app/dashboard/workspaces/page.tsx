import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getWorkspaces(userId: string) {
    return await db.workspace.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            _count: {
                select: {
                    documents: true,
                },
            },
        },
    });
}

export default async function WorkspacesPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const workspaces = await getWorkspaces(session.user.id);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Workspaces</h1>
                <Link
                    href="/dashboard/workspaces/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Create Workspace
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workspaces.map((workspace) => (
                    <Link
                        key={workspace.id}
                        href={`/dashboard/workspaces/${workspace.id}`}
                        className="block h-full"
                    >
                        <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                            <h2 className="text-xl font-semibold mb-2">{workspace.name}</h2>
                            <p className="text-gray-600 mb-4 flex-grow">
                                {workspace.description || "No description"}
                            </p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-4 border-t">
                                <span>{workspace._count.documents} documents</span>
                                <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {workspaces.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">No workspaces yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new workspace.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/dashboard/workspaces/new"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Create Workspace
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
