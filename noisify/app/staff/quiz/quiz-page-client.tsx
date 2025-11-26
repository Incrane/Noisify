'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Play, Edit, Trash2, Globe, Lock, Copy, Search, Gamepad2, Users, Clock, Sparkles, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { deleteQuiz, cloneQuiz, toggleQuizPublic, createSession } from './actions';
import { QUIZ_CATEGORIES } from '@/types/quiz';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_public: boolean;
  cover_image_url: string | null;
  question_count: number;
  creator_alias: string;
  org_name: string;
  org_logo?: string | null;
  created_at: string;
}

interface QuizPageClientProps {
  myQuizzes: QuizData[];
  communityQuizzes: QuizData[];
  canCreate: boolean;
  canHost: boolean;
}

export default function QuizPageClient({
  myQuizzes,
  communityQuizzes,
  canCreate,
  canHost
}: QuizPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDelete = async (quizId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna quiz?')) return;

    setIsLoading(quizId);
    const result = await deleteQuiz(quizId);
    setIsLoading(null);

    if (!result.success) {
      alert(result.error);
    }
    router.refresh();
  };

  const handleClone = async (quizId: string) => {
    setIsLoading(quizId);
    const result = await cloneQuiz(quizId);
    setIsLoading(null);

    if (result.success) {
      router.push(`/staff/quiz/${result.quizId}/edit`);
    } else {
      alert(result.error);
    }
  };

  const handleTogglePublic = async (quizId: string, currentStatus: boolean) => {
    setIsLoading(quizId);
    const result = await toggleQuizPublic(quizId, !currentStatus);
    setIsLoading(null);

    if (!result.success) {
      alert(result.error);
    }
    router.refresh();
  };

  const handleStartSession = async (quizId: string, accessPolicy: 'ORG_ONLY' | 'OPEN') => {
    setIsLoading(quizId);
    const result = await createSession(quizId, accessPolicy);
    setIsLoading(null);

    if (result.success) {
      router.push(`/staff/quiz/host/${result.sessionId}`);
    } else {
      alert(result.error);
    }
  };

  // Filter quizzes
  const filterQuizzes = (quizzes: QuizData[]) => {
    return quizzes.filter(quiz => {
      const matchesSearch =
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredMyQuizzes = filterQuizzes(myQuizzes);
  const filteredCommunityQuizzes = filterQuizzes(communityQuizzes);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Live Quiz
            </h1>
            <p className="text-slate-600 mt-1 max-w-lg">
              Skapa och kör interaktiva quizzes med dina ungdomar. Utmana andra fritidsgårdar eller kör lokalt.
            </p>
          </div>
        </div>
        {canCreate && (
          <Link href="/staff/quiz/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105 h-12 px-6 text-base">
              <Plus className="w-5 h-5 mr-2" />
              Skapa ny quiz
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-col space-y-6">
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'my'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              Mina quizzes
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{myQuizzes.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'community'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Community Library
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">{communityQuizzes.length}</Badge>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Sök efter titel eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus:bg-white transition-colors h-11"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-11 min-w-[200px]"
          >
            <option value="all">Alla kategorier</option>
            {QUIZ_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Quiz Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'my' ? (
            filteredMyQuizzes.length > 0 ? (
              filteredMyQuizzes.map(quiz => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isOwn={true}
                  canCreate={canCreate}
                  canHost={canHost}
                  isLoading={isLoading === quiz.id}
                  onDelete={() => handleDelete(quiz.id)}
                  onClone={() => handleClone(quiz.id)}
                  onTogglePublic={() => handleTogglePublic(quiz.id, quiz.is_public)}
                  onStartSession={(policy) => handleStartSession(quiz.id, policy)}
                />
              ))
            ) : (
              <EmptyState
                title="Inga quizzes ännu"
                description={canCreate ? "Skapa din första quiz för att komma igång!" : "Din organisation har inga quizzes ännu."}
                action={canCreate ? (
                  <Link href="/staff/quiz/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Skapa quiz
                    </Button>
                  </Link>
                ) : null}
              />
            )
          ) : (
            filteredCommunityQuizzes.length > 0 ? (
              filteredCommunityQuizzes.map(quiz => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isOwn={false}
                  canCreate={canCreate}
                  canHost={canHost}
                  isLoading={isLoading === quiz.id}
                  onClone={() => handleClone(quiz.id)}
                />
              ))
            ) : (
              <EmptyState
                title="Inga delade quizzes"
                description="Det finns inga publika quizzes från andra organisationer ännu."
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface QuizCardProps {
  quiz: QuizData;
  isOwn: boolean;
  canCreate: boolean;
  canHost: boolean;
  isLoading: boolean;
  onDelete?: () => void;
  onClone?: () => void;
  onTogglePublic?: () => void;
  onStartSession?: (policy: 'ORG_ONLY' | 'OPEN') => void;
}

function QuizCard({
  quiz,
  isOwn,
  canCreate,
  canHost,
  isLoading,
  onDelete,
  onClone,
  onTogglePublic,
  onStartSession
}: QuizCardProps) {
  const [showStartOptions, setShowStartOptions] = useState(false);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Cover Image */}
      <div className="h-48 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {quiz.cover_image_url ? (
          <Image
            src={quiz.cover_image_url}
            alt={quiz.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Gamepad2 className="w-16 h-16 text-white" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60" />

        <div className="absolute top-3 right-3 flex gap-2">
          {isOwn && (
            <Badge className={`${quiz.is_public ? 'bg-white/95 text-green-700 hover:bg-white' : 'bg-white/95 text-slate-900 hover:bg-white'} backdrop-blur-md border-0 shadow-sm font-medium`}>
              {quiz.is_public ? <Globe className="w-3 h-3 mr-1.5" /> : <Lock className="w-3 h-3 mr-1.5" />}
              {quiz.is_public ? 'Publik' : 'Privat'}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <Badge variant="secondary" className="bg-white/95 text-slate-800 backdrop-blur-md shadow-sm border-0 font-medium">
            {quiz.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {quiz.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {quiz.question_count} frågor
          </span>
          {!isOwn && (
            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md max-w-[140px] truncate">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {quiz.org_name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 mt-auto grid grid-cols-2 gap-2">
        {isOwn ? (
          <>
            {canHost ? (
              <div className="col-span-2 relative">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                  onClick={() => setShowStartOptions(!showStartOptions)}
                  disabled={isLoading || quiz.question_count === 0}
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Starta Session
                </Button>

                {showStartOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStartOptions(false)} />
                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => { onStartSession?.('ORG_ONLY'); setShowStartOptions(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-100"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Endast medlemmar</div>
                          <div className="text-xs text-slate-500">Kräver inloggning</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { onStartSession?.('OPEN'); setShowStartOptions(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Öppen för alla</div>
                          <div className="text-xs text-slate-500">Gäster kan delta via kod</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="col-span-2">
                <Button className="w-full" disabled>
                  Kan ej starta
                </Button>
              </div>
            )}

            {canCreate && (
              <div className="col-span-2 flex gap-2">
                <Link href={`/staff/quiz/${quiz.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 font-medium">
                    <Edit className="w-4 h-4 mr-2" />
                    Redigera
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-3 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onTogglePublic}>
                      {quiz.is_public ? <Lock className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                      {quiz.is_public ? 'Gör privat' : 'Dela publikt'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onClone}>
                      <Copy className="w-4 h-4 mr-2" />
                      Klona quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-2 flex gap-2">
            <Link href={`/staff/quiz/${quiz.id}/preview`} className="flex-1">
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Granska
              </Button>
            </Link>
            {canCreate && (
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={onClone}
                disabled={isLoading}
              >
                <Copy className="w-4 h-4 mr-2" />
                Klona
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
        <Gamepad2 className="w-10 h-10 text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
