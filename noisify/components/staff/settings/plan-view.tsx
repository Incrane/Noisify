import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles } from "lucide-react";

export default function PlanView() {
    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-1 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="bg-white rounded-[20px] p-8 md:p-12 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-4">
                                <Sparkles className="h-4 w-4" />
                                Nuvarande plan
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Gratis plan</h2>
                            <p className="text-slate-600 text-lg leading-relaxed mb-6">
                                Du använder just nu gratisversionen av Noisify. Perfekt för mindre verksamheter som vill komma igång digitalt.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <div className="p-1 rounded-full bg-green-100 text-green-600"><Check className="h-3 w-3" /></div>
                                    <span>Grundläggande statistik</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <div className="p-1 rounded-full bg-green-100 text-green-600"><Check className="h-3 w-3" /></div>
                                    <span>Upp till 3 aktiviteter/vecka</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto flex flex-col items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg mb-4 transform rotate-3 hover:rotate-6 transition-transform">
                                <Crown className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Uppgradera till Pro</h3>
                            <p className="text-sm text-slate-500 mb-6 text-center">Få tillgång till allt</p>
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-11 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
                                Uppgradera nu
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
