"use client";

import { useState } from "react";
import { GripVertical, Crown, Edit2, Check, X, ArrowLeftRight, UserPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { GeneratedTeam, PlayerStats } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeamEditorProps {
  teams: GeneratedTeam[];
  players: PlayerStats[];
  checkedInPlayerIds?: string[];
  onTeamsChange: (teams: GeneratedTeam[]) => void;
  disabled?: boolean;
}

const TEAM_COLORS = [
  { name: "Röd", value: "bg-red-500", hex: "#ef4444" },
  { name: "Blå", value: "bg-blue-500", hex: "#3b82f6" },
  { name: "Grön", value: "bg-green-500", hex: "#22c55e" },
  { name: "Gul", value: "bg-yellow-500", hex: "#eab308" },
  { name: "Lila", value: "bg-purple-500", hex: "#a855f7" },
  { name: "Rosa", value: "bg-pink-500", hex: "#ec4899" },
  { name: "Orange", value: "bg-orange-500", hex: "#f97316" },
  { name: "Cyan", value: "bg-cyan-500", hex: "#06b6d4" },
];

export function TeamEditor({ teams, players, checkedInPlayerIds = [], onTeamsChange, disabled }: TeamEditorProps) {
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedPlayer, setDraggedPlayer] = useState<{ source: 'team' | 'unassigned'; teamIndex?: number; playerId: string } | null>(null);
  const [dragOverTeam, setDragOverTeam] = useState<number | null>(null);

  // Get all players currently in teams
  const playersInTeams = teams.flatMap(t => t.players || []);

  // Get unassigned checked-in players (checked in but not in any team)
  const unassignedPlayers = checkedInPlayerIds.filter(id => !playersInTeams.includes(id));

  const getPlayerProfile = (playerId: string) => {
    const player = players.find(p => p.profile_id === playerId);
    return (player as { profiles?: { alias?: string; image_url?: string } })?.profiles;
  };

  const getPlayerStats = (playerId: string) => {
    return players.find(p => p.profile_id === playerId);
  };

  const handleStartEdit = (index: number, currentName: string) => {
    setEditingTeamIndex(index);
    setEditingName(currentName);
  };

  const handleSaveName = (index: number) => {
    if (!editingName.trim()) {
      toast.error("Lagnamn kan inte vara tomt");
      return;
    }
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], name: editingName.trim() };
    onTeamsChange(newTeams);
    setEditingTeamIndex(null);
    toast.success("Lagnamn uppdaterat");
  };

  const handleCancelEdit = () => {
    setEditingTeamIndex(null);
    setEditingName("");
  };

  const handleColorChange = (teamIndex: number, colorValue: string) => {
    const newTeams = [...teams];
    newTeams[teamIndex] = { ...newTeams[teamIndex], color: colorValue };
    onTeamsChange(newTeams);
    toast.success("Lagfärg uppdaterad");
  };

  const handleSetCaptain = (teamIndex: number, playerIndex: number) => {
    const newTeams = [...teams];
    const team = { ...newTeams[teamIndex] };
    const playersList = [...(team.players || [])];

    // Move the selected player to the first position (captain)
    const [captainPlayer] = playersList.splice(playerIndex, 1);
    playersList.unshift(captainPlayer);

    team.players = playersList;
    newTeams[teamIndex] = team;
    onTeamsChange(newTeams);
    toast.success("Kapten ändrad");
  };

  const handleMovePlayer = (fromTeamIndex: number, playerIndex: number, toTeamIndex: number) => {
    if (fromTeamIndex === toTeamIndex) return;

    const newTeams = [...teams];
    const fromTeam = { ...newTeams[fromTeamIndex] };
    const toTeam = { ...newTeams[toTeamIndex] };

    const fromPlayers = [...(fromTeam.players || [])];
    const toPlayers = [...(toTeam.players || [])];

    // Remove from source team
    const [movedPlayer] = fromPlayers.splice(playerIndex, 1);

    // Add to target team
    toPlayers.push(movedPlayer);

    fromTeam.players = fromPlayers;
    toTeam.players = toPlayers;

    newTeams[fromTeamIndex] = fromTeam;
    newTeams[toTeamIndex] = toTeam;

    onTeamsChange(newTeams);
    toast.success("Spelare flyttad");
  };

  // Add unassigned player to a team
  const handleAddToTeam = (playerId: string, targetTeamIndex: number) => {
    const newTeams = [...teams];
    const targetTeam = { ...newTeams[targetTeamIndex] };
    const targetPlayers = [...(targetTeam.players || [])];

    targetPlayers.push(playerId);
    targetTeam.players = targetPlayers;
    newTeams[targetTeamIndex] = targetTeam;

    onTeamsChange(newTeams);
    toast.success("Spelare tillagd i lag");
  };

  const handleAddTeam = () => {
    const newTeam: GeneratedTeam = {
      id: crypto.randomUUID(),
      name: `Lag ${teams.length + 1}`,
      players: [],
      color: TEAM_COLORS[teams.length % TEAM_COLORS.length].value,
    };
    onTeamsChange([...teams, newTeam]);
    toast.success("Lag tillagt");
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 2) {
      toast.error("Minst 2 lag krävs");
      return;
    }

    const teamToRemove = teams[index];
    if (teamToRemove.players && teamToRemove.players.length > 0) {
      toast.error("Töm laget på spelare innan du tar bort det");
      return;
    }

    const newTeams = teams.filter((_, i) => i !== index);
    onTeamsChange(newTeams);
    toast.success("Lag borttaget");
  };

  // Drag and drop handlers
  const handleDragStartFromTeam = (teamIndex: number, playerId: string) => {
    if (disabled) return;
    setDraggedPlayer({ source: 'team', teamIndex, playerId });
  };

  const handleDragStartFromUnassigned = (playerId: string) => {
    if (disabled) return;
    setDraggedPlayer({ source: 'unassigned', playerId });
  };

  const handleDragOver = (e: React.DragEvent, teamIndex: number) => {
    e.preventDefault();
    if (disabled) return;
    setDragOverTeam(teamIndex);
  };

  const handleDragLeave = () => {
    setDragOverTeam(null);
  };

  const handleDrop = (targetTeamIndex: number) => {
    if (disabled || !draggedPlayer) return;

    if (draggedPlayer.source === 'unassigned') {
      // Adding from unassigned pool
      handleAddToTeam(draggedPlayer.playerId, targetTeamIndex);
    } else if (draggedPlayer.teamIndex !== undefined && draggedPlayer.teamIndex !== targetTeamIndex) {
      // Moving between teams
      const sourceTeam = teams[draggedPlayer.teamIndex];
      const playerIndex = sourceTeam.players?.indexOf(draggedPlayer.playerId) ?? -1;
      if (playerIndex >= 0) {
        handleMovePlayer(draggedPlayer.teamIndex, playerIndex, targetTeamIndex);
      }
    }

    setDraggedPlayer(null);
    setDragOverTeam(null);
  };

  const getTeamColor = (team: GeneratedTeam, index: number) => {
    if (team.color) return team.color;
    const defaultColors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];
    return defaultColors[index % defaultColors.length];
  };

  const getTeamName = (team: GeneratedTeam, index: number) => {
    return team.name || `Lag ${index + 1}`;
  };

  if (teams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Unassigned Players Section */}
      {unassignedPlayers.length > 0 && (
        <Card className={cn("border-dashed border-2 border-amber-300 bg-amber-50", disabled && "opacity-75")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800">Spelare utan lag ({unassignedPlayers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!disabled ? (
              <p className="text-sm text-amber-700 mb-3">
                Dra spelare till ett lag eller använd menyn för att lägga till dem.
              </p>
            ) : (
              <p className="text-sm text-amber-700 mb-3">
                Checka in spelare som inte har något lag.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {unassignedPlayers.map((playerId) => {
                const profile = getPlayerProfile(playerId);
                const stats = getPlayerStats(playerId);

                return (
                  <div
                    key={playerId}
                    draggable={!disabled}
                    onDragStart={() => handleDragStartFromUnassigned(playerId)}
                    className={cn(
                      "flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200 hover:shadow-md transition-all",
                      !disabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                    )}
                  >
                    {!disabled && <GripVertical className="w-4 h-4 text-slate-400" />}
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.image_url} />
                      <AvatarFallback className="bg-slate-200 text-xs">
                        {profile?.alias?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{profile?.alias || "Okänd"}</span>
                    <span className="text-xs text-slate-500">{stats?.total_points || 0}p</span>

                    {/* Quick add to team dropdown */}
                    {!disabled && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 ml-1">
                            <ArrowLeftRight className="w-3 h-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="end">
                          <div className="text-xs font-medium text-slate-500 mb-2">
                            Lägg till i:
                          </div>
                          <div className="space-y-1">
                            {teams.map((team, teamIndex) => (
                              <button
                                key={teamIndex}
                                type="button"
                                className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-100 transition-colors text-left"
                                onClick={() => handleAddToTeam(playerId, teamIndex)}
                              >
                                <div className={cn("w-3 h-3 rounded-full", getTeamColor(team, teamIndex))} />
                                <span className="text-sm">{getTeamName(team, teamIndex)}</span>
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team, teamIndex) => {
          const teamColor = getTeamColor(team, teamIndex);
          const teamName = getTeamName(team, teamIndex);
          const isEditing = editingTeamIndex === teamIndex;
          const isDragOver = dragOverTeam === teamIndex;

          return (
            <Card
              key={team.id || teamIndex}
              className={cn(
                "transition-all",
                isDragOver && "ring-2 ring-indigo-500 bg-indigo-50"
              )}
              onDragOver={(e) => handleDragOver(e, teamIndex)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(teamIndex)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {/* Color picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-4 h-4 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 transition-all",
                          teamColor,
                          disabled && "cursor-default hover:ring-0"
                        )}
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    {!disabled && (
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="grid grid-cols-4 gap-2">
                          {TEAM_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all",
                                color.value,
                                teamColor === color.value && "ring-2 ring-offset-1 ring-slate-600"
                              )}
                              onClick={() => handleColorChange(teamIndex, color.value)}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>

                  {/* Team name */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName(teamIndex);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleSaveName(teamIndex)}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-1 justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{teamName}</span>
                        {!disabled && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={() => handleStartEdit(teamIndex, teamName)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      {!disabled && teams.length > 2 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-red-500"
                          onClick={() => handleRemoveTeam(teamIndex)}
                          title="Ta bort lag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(team.players || []).map((playerId: string, playerIndex: number) => {
                    const profile = getPlayerProfile(playerId);
                    const stats = getPlayerStats(playerId);
                    const isCaptain = playerIndex === 0;

                    return (
                      <div
                        key={playerId}
                        draggable={!disabled}
                        onDragStart={() => handleDragStartFromTeam(teamIndex, playerId)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg transition-colors group",
                          "bg-slate-50 hover:bg-slate-100",
                          !disabled && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        {!disabled && (
                          <GripVertical className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.image_url} />
                          <AvatarFallback className="bg-slate-200 text-xs">
                            {profile?.alias?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">
                              {profile?.alias || "Okänd"}
                            </span>
                            {isCaptain && (
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {stats?.total_points || 0} p
                          </div>
                        </div>

                        {!disabled && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Set as captain */}
                            {!isCaptain && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleSetCaptain(teamIndex, playerIndex)}
                                title="Gör till kapten"
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                            )}

                            {/* Move to another team */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  title="Flytta till annat lag"
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-2" align="end">
                                <div className="text-xs font-medium text-slate-500 mb-2">
                                  Flytta till:
                                </div>
                                <div className="space-y-1">
                                  {teams.map((targetTeam, targetIndex) => {
                                    if (targetIndex === teamIndex) return null;
                                    return (
                                      <button
                                        key={targetIndex}
                                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-100 transition-colors text-left"
                                        onClick={() => handleMovePlayer(teamIndex, playerIndex, targetIndex)}
                                      >
                                        <div className={cn("w-3 h-3 rounded-full", getTeamColor(targetTeam, targetIndex))} />
                                        <span className="text-sm">{getTeamName(targetTeam, targetIndex)}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(team.players || []).length === 0 && (
                    <div className="text-center py-4 text-sm text-slate-400">
                      {!disabled ? "Inga spelare - dra en spelare hit" : "Inga spelare"}
                    </div>
                  )}
                </div>
              </CardContent>
              {team.players && team.players.length > 0 && !disabled && (
                <div className="p-2 border-t text-center text-xs text-slate-400">
                  {team.players.length} spelare
                </div>
              )}
            </Card>
          );
        })}
        {/* Add Team Button */}
        {!disabled && (
          <button
            onClick={handleAddTeam}
            className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm mb-3 transition-all">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-amber-500" />
            </div>
            <span className="font-medium text-slate-500 group-hover:text-slate-700">Lägg till lag</span>
          </button>
        )}
      </div>
    </div>
  );
}
