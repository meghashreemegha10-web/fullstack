"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User as UserIcon, Bot as BotIcon } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface WorkspaceChatProps {
    workspaceId: string;
    initialMessages: Message[];
}

export function WorkspaceChat({ workspaceId, initialMessages }: WorkspaceChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.content }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to send message");
            }

            const assistantMessage = await res.json();
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : ""
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user" ? "bg-indigo-600" : "bg-green-600"
                                }`}
                        >
                            {message.role === "user" ? (
                                <UserIcon className="w-5 h-5 text-white" />
                            ) : (
                                <BotIcon className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div
                            className={`rounded-lg p-4 max-w-[80%] shadow-sm whitespace-pre-wrap ${message.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-gray-800 border"
                                }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                            <BotIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex justify-center my-4">
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-200 text-sm">
                            {error}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your documents..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
