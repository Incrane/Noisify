'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Bell, Eye, EyeOff, Loader2, Shield, Users as UsersIcon, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getPrivateMemberInfo, sendNotification } from '@/app/staff/medlemmar/member-actions';

interface PrivateUserInfo {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null; // fallback if stored as one
  email: string | null;
  phone: string | null;
  phone_number?: string | null; // fallback
  personal_number: string | null;
  birth_date?: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
}

interface MemberDetailsModalProps {
  member: {
    id: string;
    profileId: string;
    alias: string;
    userId: string | null;
    status: string;
    startDate: string;
    isLocal: boolean;
    birthYear: number | null;
  };
  children: React.ReactNode;
}

export default function MemberDetailsModal({ member, children }: MemberDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [privateInfo, setPrivateInfo] = useState<PrivateUserInfo | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isNotifying, startNotifyTransition] = useTransition();

  // Notification state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleRevealPrivate = () => {
    if (showPrivate) {
      setShowPrivate(false);
      return;
    }

    if (!member.userId) {
      toast.error('Detta är en lokal medlem utan kopplat användarkonto.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await getPrivateMemberInfo(member.userId!);
        if (result.success) {
          setPrivateInfo(result.data);
          setShowPrivate(true);
        } else {
          toast.error(result.error || 'Kunde inte hämta information');
        }
      } catch (error) {
        console.error(error);
        toast.error('Ett fel uppstod');
      }
    });
  };

  const handleChat = () => {
    toast.info('Chattfunktion kommer snart!');
  };

  const handleSendNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Fyll i både rubrik och meddelande');
      return;
    }

    if (!member.userId) {
      toast.error('Kan inte skicka notis till lokal medlem (inget konto)');
      return;
    }

    startNotifyTransition(async () => {
      try {
        const result = await sendNotification(member.userId!, notificationTitle, notificationMessage);
        if (result.success) {
          toast.success('Notis skickad!');
          setNotificationOpen(false);
          setNotificationTitle('');
          setNotificationMessage('');
        } else {
          toast.error(result.error || 'Kunde inte skicka notis');
        }
      } catch (error) {
        console.error(error);
        toast.error('Ett fel uppstod vid sändning');
      }
    });
  };

  const getFullName = (info: PrivateUserInfo) => {
    if (info.first_name && info.last_name) return `${info.first_name} ${info.last_name}`;
    return info.full_name || '-';
  };

  const getAge = (birthDateStr?: string | null) => {
    if (!birthDateStr) return '-';
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} år`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
              ${member.isLocal ? 'bg-amber-500' : 'bg-indigo-500'}`}>
              {member.alias.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{member.alias}</div>
              <div className="text-sm font-normal text-slate-500 flex items-center gap-2">
                <span className="font-mono">ID: {member.profileId.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                  ${member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {member.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Actions Bar */}
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-100 group transition-all" 
              onClick={handleChat}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors border border-transparent group-hover:border-indigo-200">
                <MessageCircle className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
              </div>
              <span className="text-xs font-medium">Starta chatt</span>
            </Button>

            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex flex-col h-auto py-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:border-amber-100 group transition-all"
                  disabled={!member.userId}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors border border-transparent group-hover:border-amber-200">
                    <Bell className="w-5 h-5 text-slate-500 group-hover:text-amber-600" />
                  </div>
                  <span className="text-xs font-medium">Skicka notis</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-slate-900">Skicka notis</h4>
                    <p className="text-sm text-slate-500">
                      Meddelandet skickas direkt till <span className="font-semibold text-slate-700">{member.alias}</span>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Rubrik</Label>
                    <Input 
                      id="title" 
                      placeholder="T.ex. Viktig information" 
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus-visible:ring-indigo-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Meddelande</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Skriv ditt meddelande här..." 
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus-visible:ring-indigo-200"
                    />
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendNotification} disabled={isNotifying}>
                    {isNotifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Skicka notis
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button 
              variant={showPrivate ? "secondary" : "outline"}
              className={`flex flex-col h-auto py-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 group transition-all
                ${showPrivate ? 'bg-slate-100 border-slate-300' : 'hover:border-slate-200'}`}
              onClick={handleRevealPrivate}
              disabled={!member.userId || isPending}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border
                ${showPrivate ? 'bg-slate-200 border-slate-300' : 'bg-slate-100 group-hover:bg-slate-200 border-transparent'}`}>
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                ) : showPrivate ? (
                  <EyeOff className="w-5 h-5 text-slate-600" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <span className="text-xs font-medium">
                {!member.userId ? 'Lokalt konto' : showPrivate ? 'Dölj identitet' : 'Visa identitet'}
              </span>
            </Button>
          </div>

          {/* Public Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Information
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-slate-500 mb-1">Kontotyp</div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  {member.isLocal ? (
                    <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      <UsersIcon className="w-3 h-3" /> Lokal medlem
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                      <Shield className="w-3 h-3" /> Digitalt konto
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Medlem sedan</div>
                <div className="font-medium text-slate-900">
                  {new Date(member.startDate).toLocaleDateString('sv-SE')}
                </div>
              </div>
              {member.birthYear && (
                <div>
                  <div className="text-slate-500 mb-1">Födelseår</div>
                  <div className="font-medium text-slate-900">{member.birthYear}</div>
                </div>
              )}
            </div>
          </div>

          {/* Private Info Section */}
          {showPrivate && privateInfo && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3>Skyddad identitetsinformation</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Fullständigt namn</div>
                  <div className="font-medium text-slate-900 text-base">
                    {getFullName(privateInfo)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">E-postadress</div>
                  <div className="font-medium text-slate-900 text-base break-all">
                    {privateInfo.email || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Telefonnummer</div>
                  <div className="font-medium text-slate-900 text-base">
                    {privateInfo.phone || privateInfo.phone_number || '-'}
                  </div>
                </div>
                 <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Personnummer</div>
                  <div className="font-medium text-slate-900 text-base font-mono tracking-wide">
                    {privateInfo.personal_number || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ålder</div>
                  <div className="font-medium text-slate-900 text-base">
                    {getAge(privateInfo.birth_date)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Födelsedatum</div>
                  <div className="font-medium text-slate-900 text-base">
                    {privateInfo.birth_date ? new Date(privateInfo.birth_date).toLocaleDateString('sv-SE') : '-'}
                  </div>
                </div>
                {privateInfo.address && (
                  <div className="col-span-2">
                    <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Adress</div>
                    <div className="font-medium text-slate-900 text-base">
                      {privateInfo.address}
                      {(privateInfo.postal_code || privateInfo.city) && (
                        <div>{privateInfo.postal_code} {privateInfo.city}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-400 italic mt-2 border-t border-slate-200 pt-2">
                Denna information är endast synlig för behörig personal. Loggas vid åtkomst.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
