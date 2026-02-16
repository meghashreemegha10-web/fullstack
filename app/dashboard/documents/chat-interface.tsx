"use client";

import { useState } from "react";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    documentId: string;
    initialMessages: Message[];
}

export default function ChatInterface({ documentId, initialMessages }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: "user" as const, content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId, question: userMessage.content }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                const text = await res.text();
                console.error("Received HTML response:", text.substring(0, 200)); // Log part of it
                setMessages((prev) => [...prev, { role: "assistant", content: "Error: Server returned an HTML page (likely 404 or 500). Check server console." }]);
                return;
            }

            const data = await res.json();

            if (data.error) {
                console.error("Error:", data.error);
                setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
            }

        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to connect to server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>Ask a question about this document!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-800"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-500 italic">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
