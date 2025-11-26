'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, GripVertical, Check, Clock, Save, Eye, ChevronUp, ChevronDown, Sparkles, Upload, Image as ImageIcon, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createQuiz, updateQuiz, uploadQuizCover } from './actions';
import UnsplashModal from '@/components/staff/unsplash-modal';
import { toast } from 'sonner';
import { QUIZ_CATEGORIES, QuizCategory, QuizOption, QuizFormData } from '@/types/quiz';

interface QuestionFormData {
  id: string;
  question_text: string;
  time_limit_seconds: number;
  options: QuizOption[];
}

interface QuizFormClientProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    category: QuizCategory;
    cover_image_url: string | null;
    is_public: boolean;
    questions: {
      id: string;
      question_text: string;
      time_limit_seconds: number;
      options: QuizOption[];
    }[];
  };
}

const ANSWER_COLORS = [
  { bg: 'bg-red-500', text: 'text-white', label: 'Röd', ring: 'ring-red-500' },
  { bg: 'bg-blue-500', text: 'text-white', label: 'Blå', ring: 'ring-blue-500' },
  { bg: 'bg-yellow-400', text: 'text-black', label: 'Gul', ring: 'ring-yellow-400' },
  { bg: 'bg-green-500', text: 'text-white', label: 'Grön', ring: 'ring-green-500' }
];

// Custom ID generator to replace crypto.randomUUID which might not be available in all client environments
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to create a fresh question with new option objects
const createNewQuestion = (): QuestionFormData => ({
  id: generateId(),
  question_text: '',
  time_limit_seconds: 20,
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]
});

export default function QuizFormClient({ mode, initialData }: QuizFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<QuizCategory>(initialData?.category || 'Allmänt');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || '');
  const [isPublic, setIsPublic] = useState(initialData?.is_public || false);
  const [questions, setQuestions] = useState<QuestionFormData[]>(
    initialData?.questions?.length
      ? initialData.questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        time_limit_seconds: q.time_limit_seconds,
        options: q.options.length === 4
          ? q.options.map(o => ({ ...o }))
          : [...q.options.map(o => ({ ...o })), ...Array(4 - q.options.length).fill(null).map(() => ({ text: '', isCorrect: false }))]
      }))
      : [createNewQuestion()]
  );

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const activeQuestion = questions[activeQuestionIndex];

  const addQuestion = () => {
    const newQuestion = createNewQuestion();
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  // Move question up/down
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newIndex);
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newQuestions = [...questions];
    const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedQuestion);

    setQuestions(newQuestions);
    setActiveQuestionIndex(dropIndex);
    setDraggedIndex(null);
    dragOverIndex.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    dragOverIndex.current = null;
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (activeQuestionIndex >= newQuestions.length) {
      setActiveQuestionIndex(newQuestions.length - 1);
    }
  };

  const updateQuestion = (index: number, updates: Partial<QuestionFormData>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].text = text;
    setQuestions(newQuestions);
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optionIndex
    }));
    setQuestions(newQuestions);
  };

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadQuizCover(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        setCoverImageUrl(result.url);
        toast.success("Omslagsbild uppladdad");
      }
    } catch (error) {
      toast.error("Kunde inte ladda upp omslagsbild");
    } finally {
      setUploadingCover(false);
    }
  }

  const handleUnsplashSelect = (url: string) => {
    setCoverImageUrl(url);
    setShowUnsplash(false);
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Ange en titel för quizen';
    if (questions.length === 0) return 'Lägg till minst en fråga';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Fråga ${i + 1} saknar frågetext`;

      const filledOptions = q.options.filter(o => o.text.trim());
      if (filledOptions.length < 2) return `Fråga ${i + 1} måste ha minst 2 svarsalternativ`;

      const hasCorrect = q.options.some(o => o.isCorrect && o.text.trim());
      if (!hasCorrect) return `Fråga ${i + 1} måste ha ett markerat rätt svar`;
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);

    const formData: QuizFormData = {
      title: title.trim(),
      description: description.trim(),
      category,
      cover_image_url: coverImageUrl.trim() || undefined,
      is_public: isPublic,
      questions: questions.map(q => ({
        question_text: q.question_text.trim(),
        time_limit_seconds: q.time_limit_seconds,
        options: q.options.filter(o => o.text.trim())
      }))
    };

    const result = mode === 'create'
      ? await createQuiz(formData)
      : await updateQuiz(initialData!.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      router.push('/staff/quiz');
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/staff/quiz">
            <Button variant="ghost" size="sm" className="hover:bg-slate-200/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'create' ? 'Skapa quiz' : 'Redigera quiz'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {questions.length} frågor • {questions.reduce((acc, q) => acc + q.time_limit_seconds, 0)} sekunder totalt
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Sparar...' : 'Spara quiz'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Quiz Info & Question List */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quiz Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-slate-900">Quizinformation</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-700">Titel <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Fredagsquiz: Musik"
                  className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-700">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv quizen..."
                  rows={3}
                  className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-slate-700">Kategori</Label>
                <div className="relative mt-1.5">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as QuizCategory)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-8"
                  >
                    {QUIZ_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">Omslagsbild</Label>

                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  {coverImageUrl ? (
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-medium">Ingen bild vald</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 px-4 bg-white/90 hover:bg-white text-slate-900 border-0"
                        onClick={() => document.getElementById('cover-upload')?.click()}
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Ladda upp
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 px-4 bg-white/90 hover:bg-white text-slate-900 border-0"
                        onClick={() => setShowUnsplash(true)}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Unsplash
                      </Button>
                    </div>
                  </div>

                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Visas i listan över quiz och i lobbyn.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <Label className="text-slate-900">Dela publikt</Label>
                  <p className="text-xs text-slate-500">Gör tillgänglig i Community Library</p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col h-[calc(100vh-600px)] min-h-[400px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                Frågor
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {questions.length}
                </span>
              </h2>
              <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1.5 h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 font-medium">
                <Plus className="w-3.5 h-3.5" />
                Lägg till
              </Button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition-all cursor-pointer border ${index === activeQuestionIndex
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                    : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                    } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                >
                  <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing transition-colors" />

                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${index === activeQuestionIndex
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-medium ${index === activeQuestionIndex ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {q.question_text || 'Ny fråga...'}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {q.time_limit_seconds}s
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'up'); }}
                        disabled={index === 0}
                        className="p-0.5 text-slate-300 hover:text-slate-600 rounded disabled:opacity-0"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveQuestion(index, 'down'); }}
                        disabled={index === questions.length - 1}
                        className="p-0.5 text-slate-300 hover:text-slate-600 rounded disabled:opacity-0"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    {questions.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1"
                        title="Ta bort"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Question Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Fråga {activeQuestionIndex + 1}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Redigera fråga och svarsalternativ
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Tidsgräns</span>
                </div>
                <select
                  value={activeQuestion.time_limit_seconds}
                  onChange={(e) => updateQuestion(activeQuestionIndex, { time_limit_seconds: parseInt(e.target.value) })}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer py-1.5 pr-8"
                >
                  <option value="10">10 sekunder</option>
                  <option value="15">15 sekunder</option>
                  <option value="20">20 sekunder</option>
                  <option value="30">30 sekunder</option>
                  <option value="45">45 sekunder</option>
                  <option value="60">60 sekunder</option>
                  <option value="90">90 sekunder</option>
                  <option value="120">120 sekunder</option>
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question_text" className="text-base font-semibold text-slate-900">Fråga <span className="text-red-500">*</span></Label>
              <Textarea
                id="question_text"
                value={activeQuestion.question_text}
                onChange={(e) => updateQuestion(activeQuestionIndex, { question_text: e.target.value })}
                placeholder="Skriv din fråga här..."
                rows={3}
                className="text-lg p-4 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none rounded-xl"
              />
            </div>

            {/* Answer Options */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-slate-900">Svarsalternativ</Label>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Markera minst ett rätt svar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeQuestion.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`relative group rounded-2xl overflow-hidden transition-all duration-200 ${option.isCorrect
                      ? `ring-4 ${ANSWER_COLORS[optIndex].ring} ring-opacity-30 scale-[1.01] shadow-lg`
                      : 'hover:scale-[1.01] hover:shadow-md'
                      }`}
                  >
                    <div className={`${ANSWER_COLORS[optIndex].bg} p-1 h-full`}>
                      <div className="bg-white/10 backdrop-blur-sm h-full p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-wider ${ANSWER_COLORS[optIndex].text} opacity-80`}>
                            {ANSWER_COLORS[optIndex].label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCorrectOption(activeQuestionIndex, optIndex)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${option.isCorrect
                              ? 'bg-white text-green-600 shadow-md scale-110'
                              : 'bg-black/20 text-white/50 hover:bg-black/30 hover:scale-110'
                              }`}
                            title={option.isCorrect ? 'Rätt svar' : 'Markera som rätt svar'}
                          >
                            <Check className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>

                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(activeQuestionIndex, optIndex, e.target.value)}
                          placeholder={`Alternativ ${optIndex + 1}...`}
                          className={`bg-white/90 border-0 text-slate-900 placeholder:text-slate-400 text-lg font-medium h-14 shadow-inner focus:bg-white focus:ring-0`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3 px-1">
              <Eye className="w-4 h-4" />
              Förhandsvisning (Spelarvy)
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 text-center shadow-2xl border border-slate-800 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-8 leading-tight drop-shadow-lg">
                  {activeQuestion.question_text || 'Din fråga visas här...'}
                </h3>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {activeQuestion.options.map((option, optIndex) => (
                    option.text.trim() && (
                      <div
                        key={optIndex}
                        className={`${ANSWER_COLORS[optIndex].bg} ${ANSWER_COLORS[optIndex].text} py-6 px-4 rounded-xl font-bold text-lg shadow-lg transform transition-transform hover:scale-[1.02]`}
                      >
                        {option.text}
                      </div>
                    )
                  ))}
                  {!activeQuestion.options.some(o => o.text.trim()) && (
                    <div className="col-span-2 py-8 text-slate-500 italic border-2 border-dashed border-slate-700 rounded-xl">
                      Svarsalternativ kommer visas här
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UnsplashModal
        isOpen={showUnsplash}
        onClose={() => setShowUnsplash(false)}
        onSelect={handleUnsplashSelect}
        orgId="" // Not needed for search, but required by props. We can pass empty string or handle in modal.
      />
    </div>
  );
}
