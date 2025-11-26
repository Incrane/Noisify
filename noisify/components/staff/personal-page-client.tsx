'use client';

import { useState } from 'react';
import { Plus, MoreVertical, User, Shield, Calendar, Mail } from 'lucide-react';
import NewStaffModal from './new-staff-modal';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface StaffMember {
  id: string;
  profileId: string;
  alias: string;
  userId: string | null;
  roleId: number;
  joinedAt: string;
  status: string;
  isLocal: boolean;
  email?: string; // Optional if we have it
}

interface PersonalPageClientProps {
  staff: StaffMember[];
  orgId: string;
  currentUserRoleId: number;
}

export default function PersonalPageClient({ staff, orgId, currentUserRoleId }: PersonalPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManageStaff = currentUserRoleId >= 3;

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 5: return 'Super Admin';
      case 4: return 'Admin';
      case 3: return 'Manager';
      case 2: return 'Personal';
      case 1: return 'Assistent';
      default: return 'Medlem';
    }
  };

  const getRoleBadgeColor = (roleId: number) => {
    if (roleId >= 4) return "bg-purple-100 text-purple-700 border-purple-200";
    if (roleId === 3) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Personal</h2>
          <p className="text-slate-500">Hantera personal och behörigheter</p>
        </div>
        {canManageStaff && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Bjud in personal
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <User className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium">Ingen personal hittades</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Namn</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Roll</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Gick med</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Åtgärd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-medium">
                        {member.alias.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{member.alias}</div>
                        {member.email && <div className="text-xs text-slate-500">{member.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getRoleBadgeColor(member.roleId)}>
                      {getRoleName(member.roleId)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(member.joinedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManageStaff && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hantera</DropdownMenuLabel>
                          <DropdownMenuItem>Redigera roll</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Ta bort</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orgId={orgId}
      />
    </div>
  );
}
