"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMatchDay } from "@/app/actions/tournament";
import { toast } from "sonner";

export default function NewMatchDayPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Datum och tid krävs");
      return;
    }

    setLoading(true);

    const result = await createMatchDay({
      season_id: seasonId,
      date: new Date(date).toISOString(),
      location: location || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Matchdag skapad!");
      router.push(`/staff/tournament/${seasonId}?tab=matchdays`);
    } else {
      toast.error(result.error || "Kunde inte skapa matchdag");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/staff/tournament/${seasonId}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ny matchdag</h1>
          <p className="text-slate-500">Skapa en ny matchdag för säsongen</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Matchdagsinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Datum och tid *
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Välj datum och tid för matchdagen
              </p>
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Plats
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="t.ex. Stora salen"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">Anteckningar</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Eventuell information till spelarna..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/staff/tournament/${seasonId}`)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Skapar..." : "Skapa matchdag"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
