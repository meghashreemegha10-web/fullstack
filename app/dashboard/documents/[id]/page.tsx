import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChatInterface from "../chat-interface";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Document Q&A',
};

// Define interfaces for the component props
interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DocumentChatPage(props: PageProps) {
    // Await params first
    const params = await props.params;
    const { id } = params;

    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const document = await db.document.findUnique({
        where: {
            id: id,
            userId: session.user.id,
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    if (!document) {
        redirect("/dashboard/documents");
    }

    // Transform messages to match ChatInterface interface
    const initialMessages = document.messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content
    }));

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard/documents"
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
                >
                    &larr; Back to Documents
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            </div>

            <ChatInterface
                documentId={document.id}
                initialMessages={initialMessages}
            />
        </div>
    );
}
