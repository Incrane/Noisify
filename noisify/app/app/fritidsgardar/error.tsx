'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="p-4">
            <h2 className="text-red-500 font-bold">Something went wrong!</h2>
            <pre className="text-xs bg-slate-100 p-2 rounded mt-2 overflow-auto">
                {error.message}
                {error.stack}
            </pre>
            <button
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    )
}
