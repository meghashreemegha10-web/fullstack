"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { RegisterSchema } from "@/lib/schemas"
import { register } from "@/app/actions/auth"
import { useState, useTransition } from "react"
import Link from "next/link"

export default function RegisterPage() {
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
    })

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("")
        setSuccess("")
        startTransition(() => {
            register(values).then((data) => {
                if (data.error) {
                    setError(data.error)
                }
                if (data.success) {
                    setSuccess(data.success)
                }
            })
        })
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Create an account</h1>
                <p className="text-gray-500">Enter your details to register</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                        Name
                    </label>
                    <input
                        {...form.register("name")}
                        disabled={isPending}
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="John Doe"
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm font-medium text-destructive text-red-500">{form.formState.errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                        Email
                    </label>
                    <input
                        {...form.register("email")}
                        disabled={isPending}
                        type="email"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="m@example.com"
                    />
                    {form.formState.errors.email && (
                        <p className="text-sm font-medium text-destructive text-red-500">{form.formState.errors.email.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                        Password
                    </label>
                    <input
                        {...form.register("password")}
                        disabled={isPending}
                        type="password"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="******"
                    />
                    {form.formState.errors.password && (
                        <p className="text-sm font-medium text-destructive text-red-500">{form.formState.errors.password.message}</p>
                    )}
                </div>

                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive text-red-500 bg-red-100 border border-red-200">
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500 bg-emerald-100 border border-emerald-200">
                        <p>{success}</p>
                    </div>
                )}

                <button
                    disabled={isPending}
                    type="submit"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full bg-black text-white"
                >
                    {isPending ? "Creating account..." : "Register"}
                </button>
            </form>
            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Login
                </Link>
            </div>
        </div>
    )
}
