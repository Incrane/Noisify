export default function LoadingLogo() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span className="text-white font-bold text-4xl">N</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">Noisify</span>
            </div>
        </div>
    )
}
