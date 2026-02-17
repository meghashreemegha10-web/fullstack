import { auth } from "@/auth";
import { db } from "@/lib/db";
import { WorkspaceChat } from "@/components/workspace/workspace-chat";
import { WorkspaceInfo } from "@/components/workspace/workspace-info";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function WorkspacePage(props: PageProps) {
    const params = await props.params;
    const { id } = params;

    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const workspace = await db.workspace.findUnique({
        where: {
            id: id,
            userId: session.user.id,
        },
        include: {
            documents: {
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                },
            },
            messages: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    if (!workspace) {
        redirect("/dashboard/workspaces");
    }

    // Transform messages to match component interface
    const formattedMessages = workspace.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
    }));

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/workspaces" className="text-gray-500 hover:text-gray-700">
                        &larr; Back
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{workspace.name}</h1>
                        {workspace.description && (
                            <p className="text-sm text-gray-500">{workspace.description}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <div className="flex-1 min-w-0">
                    <WorkspaceChat
                        workspaceId={workspace.id}
                        initialMessages={formattedMessages}
                    />
                </div>

                {/* Sidebar Info */}
                <WorkspaceInfo
                    workspaceId={workspace.id}
                    documents={workspace.documents}
                />
            </div>
        </div>
    );
}
