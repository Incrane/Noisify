import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FavoritesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("v_user_profile")
        .select("profile_id")
        .eq("user_id", user.id)
        .single();

    // Fetch favorites using the view
    const { data: favorites } = await supabase
        .from("v_my_favorites")
        .select("*")
        .eq("profile_id", profile?.profile_id);

    const activities = favorites?.filter((f: any) => f.item_type === 'activity') || [];
    const courses = favorites?.filter((f: any) => f.item_type === 'course') || [];
    const organizations = favorites?.filter((f: any) => f.item_type === 'organization') || [];

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/app/profil">
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </div>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mina Favoriter</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Sparade aktiviteter, kurser och organisationer.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="activities" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="activities">Aktiviteter ({activities.length})</TabsTrigger>
                    <TabsTrigger value="courses">Kurser ({courses.length})</TabsTrigger>
                    <TabsTrigger value="organizations">Organisationer ({organizations.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="activities" className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((fav: any) => (
                            <FavoriteCard key={fav.favorite_id} item={fav} />
                        ))
                    ) : (
                        <EmptyState message="Inga sparade aktiviteter" />
                    )}
                </TabsContent>

                <TabsContent value="courses" className="space-y-4">
                    {courses.length > 0 ? (
                        courses.map((fav: any) => (
                            <FavoriteCard key={fav.favorite_id} item={fav} />
                        ))
                    ) : (
                        <EmptyState message="Inga sparade kurser" />
                    )}
                </TabsContent>

                <TabsContent value="organizations" className="space-y-4">
                    {organizations.length > 0 ? (
                        organizations.map((fav: any) => (
                            <FavoriteCard key={fav.favorite_id} item={fav} />
                        ))
                    ) : (
                        <EmptyState message="Inga sparade organisationer" />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function FavoriteCard({ item }: { item: any }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 group relative">
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                        {item.item_name.charAt(0)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{item.item_name}</h3>
                <p className="text-sm text-slate-500 truncate">{item.organization_name}</p>
                <div className="mt-2 flex items-center gap-2">
                    <Link href={item.item_url || '#'} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                        Visa detaljer
                    </Link>
                </div>
            </div>
            <button className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                <Heart className="w-5 h-5 fill-current" />
            </button>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Heart className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">{message}</p>
        </div>
    );
}
