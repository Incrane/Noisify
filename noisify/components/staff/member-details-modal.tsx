'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getPrivateMemberInfo,
  sendNotification,
  updateLocalMember,
  banMemberFromOrg,
  cancelMembership,
  reactivateMembership,
  requireNewAlias,
  sendWarningNotification,
  removeMemberFromChatGroups
} from '@/app/staff/medlemmar/actions';
import { startStaffChat } from '@/app/staff/chatt/actions';
import {
  MessageCircle,
  Bell,
  Loader2,
  Send,
  EyeOff,
  Eye,
  Users as UsersIcon,
  Shield,
  Pencil,
  X,
  Save,
  Settings2,
  RefreshCw,
  AlertTriangle,
  Ban,
  LogOut,
  UserCheck,
  MessageCircleOff,
  Sparkles
} from 'lucide-react';
import { MemberPerksModal } from './member-perks-modal';

interface PrivateUserInfo {
  first_name: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email: string | null;
  phone: string | null;
  phone_number?: string | null;
  personal_number: string | null;
  birth_date?: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
}

interface LocalMemberDetails {
  alias?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  verk_id_nummer?: string | null;
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
    // Extra fields from RPC for local members
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    birth_date?: string | null;
    notes?: string | null;
    verk_id_nummer?: string | null;
  };
  children: React.ReactNode;
  orgId?: string; // Needed for updates
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function MemberDetailsModal({ member, children, orgId, open, onOpenChange }: MemberDetailsModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [privateInfo, setPrivateInfo] = useState<PrivateUserInfo | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalIsOpen;

  if (!setIsOpen) {
    // Should not happen if types are correct, but safe fallback
    console.error("MemberDetailsModal: Missing onOpenChange handler for controlled component");
  }

  const safeSetIsOpen = (value: boolean) => {
    if (setIsOpen) {
      setIsOpen(value);
    }
  };

  const [showPrivate, setShowPrivate] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Notification state
  const [isNotifying, startNotifyTransition] = useTransition();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Edit state for local members
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<LocalMemberDetails>({
    alias: member.alias || '',
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone_number: member.phone_number,
    birth_date: member.birth_date,
    notes: member.notes,
    verk_id_nummer: member.verk_id_nummer
  });

  // Member management actions state
  const [isManagementPending, startManagementTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'ban' | 'cancel' | 'reactivate' | 'alias' | 'warning' | 'removeChats' | null;
    title: string;
    description: string;
  }>({ open: false, type: null, title: '', description: '' });
  const [warningMessage, setWarningMessage] = useState('');
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);

  const handleChat = async () => {
    if (member.isLocal) {
      toast.info('Chatt är inte tillgängligt för lokala medlemmar då de saknar konto.');
      return;
    }

    if (!member.profileId) {
      toast.error('Kan inte starta chatt: Medlemmen saknar profil-ID.');
      return;
    }

    if (!orgId) {
      toast.error('Kan inte starta chatt: Organisations-ID saknas.');
      return;
    }

    try {
      const result = await startStaffChat(orgId, member.profileId);
      if (result.success && result.groupId) {
        safeSetIsOpen(false);
        router.push(`/staff/chatt?groupId=${result.groupId}`);
      }
    } catch (error: any) {
      console.error("Failed to start chat:", error);
      toast.error(error.message || 'Ett fel uppstod vid start av chatt');
    }
  };

  const handleRevealPrivate = () => {
    if (showPrivate) {
      setShowPrivate(false);
      return;
    }

    if (!member.userId) {
      // For local members, we just show the "private" section which is actually just their details
      setShowPrivate(true);
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
        console.error("Failed to fetch private info:", error);
        toast.error('Kunde inte hämta information');
      }
    });
  };

  const handleSendNotification = () => {
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

  const handleSaveLocalMember = () => {
    if (!orgId) {
      toast.error('Saknar organisations-ID');
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateLocalMember(member.id, orgId, {
          alias: editForm.alias,
          verkIdNummer: editForm.verk_id_nummer || undefined,
          firstName: editForm.first_name || undefined,
          lastName: editForm.last_name || undefined,
          email: editForm.email || undefined,
          phone: editForm.phone_number || undefined,
          birthDate: editForm.birth_date || undefined,
          notes: editForm.notes || undefined
        });

        if (result.success) {
          toast.success('Uppgifter sparade');
          setIsEditing(false);
          // Ideally we should update the local member object or revalidate
          // For now, close modal or rely on parent revalidation
        } else {
          toast.error(result.error || 'Kunde inte spara');
        }
      } catch (error) {
        console.error(error);
        toast.error('Ett fel uppstod');
      }
    });
  };

  // Member management action handlers
  const handleManagementAction = (action: 'ban' | 'cancel' | 'reactivate' | 'alias' | 'warning' | 'removeChats') => {
    const dialogs = {
      ban: {
        title: 'Blockera medlem',
        description: `Är du säker på att du vill blockera ${member.alias} från organisationen? Medlemmen kommer att förlora åtkomst till aktiviteter och chatt.`
      },
      cancel: {
        title: 'Avsluta medlemskap',
        description: `Vill du avsluta medlemskapet för ${member.alias}? Medlemmen kan ansöka om nytt medlemskap senare.`
      },
      reactivate: {
        title: 'Återaktivera medlemskap',
        description: `Vill du återaktivera medlemskapet för ${member.alias}?`
      },
      alias: {
        title: 'Kräv nytt alias',
        description: `${member.alias} kommer att tvingas välja ett nytt alias. Det nuvarande aliaset kommer att blockeras och kan inte användas av någon annan.`
      },
      warning: {
        title: 'Skicka varning',
        description: `Skriv ett varningsmeddelande till ${member.alias}:`
      },
      removeChats: {
        title: 'Ta bort från chattgrupper',
        description: `Ta bort ${member.alias} från alla chattgrupper i denna organisation?`
      }
    };

    setConfirmDialog({
      open: true,
      type: action,
      title: dialogs[action].title,
      description: dialogs[action].description
    });
  };

  const executeManagementAction = () => {
    if (!orgId || !confirmDialog.type) return;

    startManagementTransition(async () => {
      try {
        let result;

        switch (confirmDialog.type) {
          case 'ban':
            result = await banMemberFromOrg(member.id, orgId);
            break;
          case 'cancel':
            result = await cancelMembership(member.id, orgId);
            break;
          case 'reactivate':
            result = await reactivateMembership(member.id, orgId);
            break;
          case 'alias':
            result = await requireNewAlias(member.profileId, orgId);
            break;
          case 'warning':
            if (!warningMessage.trim()) {
              toast.error('Ange ett varningsmeddelande');
              return;
            }
            result = await sendWarningNotification(member.profileId, orgId, warningMessage);
            setWarningMessage('');
            break;
          case 'removeChats':
            result = await removeMemberFromChatGroups(member.profileId, orgId);
            break;
        }

        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success(result.message || 'Åtgärden utfördes');
          setConfirmDialog({ open: false, type: null, title: '', description: '' });
        }
      } catch (error) {
        console.error('Management action error:', error);
        toast.error('Ett fel uppstod');
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
    <Dialog open={isOpen} onOpenChange={safeSetIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
              ${member.isLocal ? 'bg-amber-500' : 'bg-indigo-500'}`}>
              {member.alias.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{member.alias}</div>
              <div className="text-sm font-normal text-slate-500 flex items-center gap-2">
                <span className="font-mono">ID: {member.profileId?.slice(0, 8) || member.id.slice(0, 8)}</span>
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
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              className={`flex flex-col h-auto py-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-100 group transition-all ${member.isLocal ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleChat}
              disabled={member.isLocal}
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
              disabled={(!member.userId && !member.isLocal) || isPending}
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
                {showPrivate ? 'Dölj uppgifter' : 'Visa uppgifter'}
              </span>
            </Button>

            {/* Member Management Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-purple-50 hover:border-purple-100 group transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors border border-transparent group-hover:border-purple-200">
                    <Settings2 className="w-5 h-5 text-slate-500 group-hover:text-purple-600" />
                  </div>
                  <span className="text-xs font-medium">Hantera</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Edit info - for local members, toggle edit mode */}
                {member.isLocal && (
                  <DropdownMenuItem onClick={() => { setShowPrivate(true); setIsEditing(true); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Uppdatera uppgifter
                  </DropdownMenuItem>
                )}

                {/* Actions for digital members only */}
                {!member.isLocal && (
                  <>
                    <DropdownMenuItem onClick={() => handleManagementAction('alias')}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Kräv nytt alias
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManagementAction('warning')}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Skicka varning
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManagementAction('removeChats')}>
                      <MessageCircleOff className="w-4 h-4 mr-2" />
                      Ta bort från chattgrupper
                    </DropdownMenuItem>
                  </>
                )}

                {/* Förmåner option for all members */}
                <DropdownMenuItem onClick={() => setIsPerksModalOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Förmåner
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Membership status actions */}
                {member.status === 'active' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleManagementAction('cancel')}
                      className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Avsluta medlemskap
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleManagementAction('ban')}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Blockera från organisation
                    </DropdownMenuItem>
                  </>
                )}

                {/* Reactivate for suspended/cancelled members */}
                {(member.status === 'suspended' || member.status === 'cancelled' || member.status === 'expired') && (
                  <DropdownMenuItem
                    onClick={() => handleManagementAction('reactivate')}
                    className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Återaktivera medlemskap
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Confirmation Dialog */}
          <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Warning message input */}
              {confirmDialog.type === 'warning' && (
                <div className="py-2">
                  <Textarea
                    placeholder="Skriv varningsmeddelande..."
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isManagementPending}>
                  Avbryt
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    executeManagementAction();
                  }}
                  disabled={isManagementPending}
                  className={confirmDialog.type === 'ban' || confirmDialog.type === 'cancel' ? 'bg-red-600 hover:bg-red-700' : confirmDialog.type === 'reactivate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                >
                  {isManagementPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Bekräfta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                  {member.startDate ? new Date(member.startDate).toLocaleDateString('sv-SE') : '-'}
                </div>
              </div>
              {!!member.birthYear && (
                <div>
                  <div className="text-slate-500 mb-1">Födelseår</div>
                  <div className="font-medium text-slate-900">{member.birthYear}</div>
                </div>
              )}
            </div>
          </div>

          {/* Private Info Section / Local Member Details */}
          {showPrivate && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h3>{member.isLocal ? 'Medlemsuppgifter' : 'Skyddad identitetsinformation'}</h3>
                </div>
                {member.isLocal && !isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Redigera
                  </Button>
                )}
              </div>

              {member.isLocal && isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs">Alias</Label>
                      <Input
                        value={editForm.alias || ''}
                        onChange={e => setEditForm({ ...editForm, alias: e.target.value })}
                        className="bg-white h-9"
                        placeholder="Ange alias"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Förnamn</Label>
                      <Input
                        value={editForm.first_name || ''}
                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Efternamn</Label>
                      <Input
                        value={editForm.last_name || ''}
                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">E-post</Label>
                      <Input
                        value={editForm.email || ''}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Telefon</Label>
                      <Input
                        value={editForm.phone_number || ''}
                        onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Födelsedatum</Label>
                      <DatePicker
                        date={editForm.birth_date ? new Date(editForm.birth_date) : undefined}
                        setDate={(date) => {
                          if (date) {
                            // Convert Date to YYYY-MM-DD string
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setEditForm({ ...editForm, birth_date: `${year}-${month}-${day}` });
                          } else {
                            setEditForm({ ...editForm, birth_date: undefined });
                          }
                        }}
                        className="bg-white h-9 w-full"
                        fromYear={1925}
                        toYear={new Date().getFullYear()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">ID-nummer / Kortnr</Label>
                      <Input
                        value={editForm.verk_id_nummer || ''}
                        onChange={e => setEditForm({ ...editForm, verk_id_nummer: e.target.value })}
                        className="bg-white h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Anteckningar</Label>
                    <Textarea
                      value={editForm.notes || ''}
                      onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      className="bg-white min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1.5" /> Avbryt
                    </Button>
                    <Button size="sm" onClick={handleSaveLocalMember} disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                      Spara
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {member.isLocal ? (
                    // Local Member View
                    <>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Namn</div>
                        <div className="font-medium text-slate-900 text-base">
                          {editForm.first_name || editForm.last_name ? `${editForm.first_name || ''} ${editForm.last_name || ''}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">E-post</div>
                        <div className="font-medium text-slate-900 text-base break-all">
                          {editForm.email || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Telefon</div>
                        <div className="font-medium text-slate-900 text-base">
                          {editForm.phone_number || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">ID-nummer</div>
                        <div className="font-medium text-slate-900 text-base">
                          {editForm.verk_id_nummer || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ålder</div>
                        <div className="font-medium text-slate-900 text-base">
                          {getAge(editForm.birth_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Födelsedatum</div>
                        <div className="font-medium text-slate-900 text-base">
                          {editForm.birth_date || '-'}
                        </div>
                      </div>
                      {editForm.notes && (
                        <div className="col-span-2">
                          <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">Anteckningar</div>
                          <div className="font-medium text-slate-900 text-base bg-slate-100 p-2 rounded-md text-sm">
                            {editForm.notes}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Digital Member View (Existing)
                    privateInfo && (
                      <>
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
                      </>
                    )
                  )}
                </div>
              )}

              <div className="text-xs text-slate-400 italic mt-2 border-t border-slate-200 pt-2">
                Denna information är endast synlig för behörig personal. Loggas vid åtkomst.
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Member Perks Modal */}
      <MemberPerksModal
        isOpen={isPerksModalOpen}
        onClose={() => setIsPerksModalOpen(false)}
        memberId={member.profileId}
        memberAlias={member.alias}
        orgId={orgId || ''}
      />
    </Dialog>
  );
}
