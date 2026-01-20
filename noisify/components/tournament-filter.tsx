"use client";

import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface TournamentFilterProps {
  organizations: { id: string; name: string }[];
  currentFilter?: string;
}

export default function TournamentFilter({ organizations, currentFilter }: TournamentFilterProps) {
  const router = useRouter();

  const handleFilterChange = (value: string) => {
    if (value === "all") {
      router.push("/app/turneringar");
    } else {
      router.push(`/app/turneringar?org=${value}`);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-4 h-4 text-slate-400" />
      <Select value={currentFilter || "all"} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Alla fritidsgårdar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla fritidsgårdar</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
