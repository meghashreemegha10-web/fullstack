import Link from "next/link"

export default function PendingPage() {
    return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-50 text-center">
            <h1 className="text-4xl font-bold text-gray-800">Account Pending Approval</h1>
            <p className="max-w-md text-gray-600">
                Your account has been created successfully but requires administrator approval before you can access the dashboard.
            </p>
            <p className="text-sm text-gray-500">
                Please check back later or contact support.
            </p>
            <Link
                href="/login"
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
                Return to Login
            </Link>
        </div>
    )
}
