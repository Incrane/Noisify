"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createSeason, getGenders, getTargetSubgroups } from "@/app/actions/tournament";
import type { PointConfig, RegistrationConfig } from "@/types/tournament";
import { toast } from "sonner";

interface CreateSeasonModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_POINT_CONFIG: PointConfig = {
  goal: 1,
  assist: 1,
  win: 3,
};

export function CreateSeasonModal({ orgId, onClose, onSuccess }: CreateSeasonModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  
  // Point config
  const [pointConfig, setPointConfig] = useState<PointConfig>(DEFAULT_POINT_CONFIG);
  const [newEventType, setNewEventType] = useState("");
  const [newEventPoints, setNewEventPoints] = useState(1);
  
  // Registration config
  const [registrationMethod, setRegistrationMethod] = useState<"manual" | "automatic">("automatic");
  const [accessLevel, setAccessLevel] = useState<"open_for_all" | "members_only" | "selected_members">("open_for_all");
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const [allowedGenders, setAllowedGenders] = useState<string[]>([]);
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  
  // Options
  const [genders, setGenders] = useState<{ id: string; name: string }[]>([]);
  const [targetSubgroups, setTargetSubgroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const [genderData, subgroupData] = await Promise.all([
        getGenders(),
        getTargetSubgroups(),
      ]);
      setGenders(genderData);
      setTargetSubgroups(subgroupData);
    }
    loadOptions();
  }, []);

  const addEventType = () => {
    if (newEventType && !pointConfig[newEventType]) {
      setPointConfig({ ...pointConfig, [newEventType]: newEventPoints });
      setNewEventType("");
      setNewEventPoints(1);
    }
  };

  const removeEventType = (key: string) => {
    const newConfig = { ...pointConfig };
    delete newConfig[key];
    setPointConfig(newConfig);
  };

  const updateEventPoints = (key: string, value: number) => {
    setPointConfig({ ...pointConfig, [key]: value });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Namn krävs");
      return;
    }

    setLoading(true);

    const registrationConfig: RegistrationConfig = {
      method: registrationMethod,
    };

    if (registrationMethod === "automatic") {
      registrationConfig.access = accessLevel;
      if (minAge) registrationConfig.min_age = minAge;
      if (maxAge) registrationConfig.max_age = maxAge;
      if (allowedGenders.length > 0) registrationConfig.allowed_genders = allowedGenders;
      if (allowedGroups.length > 0) registrationConfig.allowed_groups = allowedGroups;
    }

    const result = await createSeason({
      name,
      description: description || undefined,
      organization_id: orgId,
      point_config: pointConfig,
      registration_config: registrationConfig,
      starts_at: startsAt || undefined,
      ends_at: endsAt || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Säsong skapad!");
      onSuccess();
    } else {
      toast.error(result.error || "Kunde inte skapa säsong");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Skapa ny säsong</h2>
            <p className="text-sm text-slate-500">Steg {step} av 3</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 mb-4">Grundläggande information</h3>
              
              <div>
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. La Liga HT25"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv turneringen..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starts">Startdatum</Label>
                  <Input
                    id="starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ends">Slutdatum</Label>
                  <Input
                    id="ends"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 mb-4">Poängsystem</h3>
              <p className="text-sm text-slate-500 mb-4">
                Konfigurera hur många poäng varje händelse ger. Du kan lägga till egna händelsetyper.
              </p>

              <div className="space-y-2">
                {Object.entries(pointConfig).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="flex-1 font-medium text-slate-700 capitalize">{key}</span>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateEventPoints(key, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                      min={0}
                    />
                    <span className="text-sm text-slate-500">poäng</span>
                    {!["goal", "assist", "win"].includes(key) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEventType(key)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Ny händelsetyp"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={newEventPoints}
                  onChange={(e) => setNewEventPoints(parseInt(e.target.value) || 1)}
                  className="w-20"
                  min={1}
                />
                <Button onClick={addEventType} variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 mb-4">Registreringsregler</h3>

              <div>
                <Label>Hantering</Label>
                <Select
                  value={registrationMethod}
                  onValueChange={(v) => setRegistrationMethod(v as "manual" | "automatic")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatisk</SelectItem>
                    <SelectItem value="manual">Manuell</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  {registrationMethod === "automatic"
                    ? "Användare kan gå med själva om de uppfyller kraven"
                    : "Personal måste bjuda in eller godkänna varje deltagare"}
                </p>
              </div>

              {registrationMethod === "automatic" && (
                <>
                  <div>
                    <Label>Behörighet</Label>
                    <Select
                      value={accessLevel}
                      onValueChange={(v) => setAccessLevel(v as typeof accessLevel)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open_for_all">Öppen för alla</SelectItem>
                        <SelectItem value="members_only">Endast medlemmar</SelectItem>
                        <SelectItem value="selected_members">Utvalda medlemmar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimiålder</Label>
                      <Input
                        type="number"
                        value={minAge || ""}
                        onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Ingen gräns"
                        className="mt-1"
                        min={10}
                        max={99}
                      />
                    </div>
                    <div>
                      <Label>Maxålder</Label>
                      <Input
                        type="number"
                        value={maxAge || ""}
                        onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Ingen gräns"
                        className="mt-1"
                        min={10}
                        max={99}
                      />
                    </div>
                  </div>

                  {genders.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Tillåtna kön</Label>
                      <div className="space-y-2">
                        {genders.map((gender) => (
                          <div key={gender.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`gender-${gender.id}`}
                              checked={allowedGenders.includes(gender.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setAllowedGenders([...allowedGenders, gender.id]);
                                } else {
                                  setAllowedGenders(allowedGenders.filter((g) => g !== gender.id));
                                }
                              }}
                            />
                            <Label htmlFor={`gender-${gender.id}`} className="font-normal">
                              {gender.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Lämna tomt för att tillåta alla</p>
                    </div>
                  )}

                  {targetSubgroups.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Tillåtna målgrupper</Label>
                      <div className="space-y-2">
                        {targetSubgroups.map((group) => (
                          <div key={group.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={allowedGroups.includes(group.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setAllowedGroups([...allowedGroups, group.id]);
                                } else {
                                  setAllowedGroups(allowedGroups.filter((g) => g !== group.id));
                                }
                              }}
                            />
                            <Label htmlFor={`group-${group.id}`} className="font-normal">
                              {group.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Lämna tomt för att tillåta alla</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <Button variant="ghost" onClick={step > 1 ? () => setStep(step - 1) : onClose}>
            {step > 1 ? "Tillbaka" : "Avbryt"}
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Nästa
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Skapar..." : "Skapa säsong"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
