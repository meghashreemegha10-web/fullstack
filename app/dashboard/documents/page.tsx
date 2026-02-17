import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DocumentUploadForm from "./upload-form";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
    const session = await auth();

    // REMOVED REDIRECT
    // if (!session?.user) {
    //     redirect("/login");
    // }

    let documents: any[] = [];
    if (session?.user?.id) {
        documents = await db.document.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Documents & Q&A</h1>

            {session?.user ? (
                <DocumentUploadForm />
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-8">
                    <p className="font-medium">Guest Mode</p>
                    <p className="text-sm mt-1">You are browsing as a guest. Please <Link href="/login" className="underline font-semibold">log in</Link> to upload and manage documents.</p>
                </div>
            )}


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">Your Documents</h2>
                </div>

                {documents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>{session?.user ? "No documents uploaded yet." : "No documents available in guest mode."}</p>
                        {session?.user && <p className="text-sm mt-2">Upload a PDF or Text file to get started.</p>}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {documents.map((doc) => (
                            <li key={doc.id} className="hover:bg-gray-50 transition-colors">
                                <Link
                                    href={`/dashboard/documents/${doc.id}`}
                                    className="block px-6 py-4"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-blue-600 hover:text-blue-800 text-lg">
                                                {doc.title}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
