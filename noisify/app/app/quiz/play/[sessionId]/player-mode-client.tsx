'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Flame, Check, X, Loader2 } from 'lucide-react';
import { submitAnswer, getLeaderboard } from '@/app/staff/quiz/actions';
import { QuizOption, QuizParticipant, LeaderboardEntry } from '@/types/quiz';

interface Question {
  id: string;
  question_text: string;
  time_limit_seconds: number;
  order_index: number;
  options: QuizOption[];
}

interface SessionData {
  id: string;
  status: string;
  current_question_index: number;
  current_state: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

interface PlayerModeClientProps {
  session: SessionData;
  quiz: QuizData;
  participant: QuizParticipant;
  exitPath?: string;
}

const ANSWER_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-white', icon: '▲' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-white', icon: '◆' },
  { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-black', icon: '●' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-white', icon: '■' }
];

export default function PlayerModeClient({ session, quiz, participant, exitPath = '/app/aktiviteter' }: PlayerModeClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [currentState, setCurrentState] = useState(session.current_state);
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.current_question_index);
  const [score, setScore] = useState(participant.score);
  const [streak, setStreak] = useState(participant.streak);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const currentQuestion = currentQuestionIndex >= 0 ? quiz.questions[currentQuestionIndex] : null;

  // Subscribe to session changes
  useEffect(() => {
    const channel = supabase
      .channel(`player_session_${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quiz_sessions',
        filter: `id=eq.${session.id}`
      }, (payload) => {
        const newSession = payload.new as SessionData;
        setCurrentState(newSession.current_state);
        setSessionStatus(newSession.status);

        if (newSession.current_question_index !== currentQuestionIndex) {
          setCurrentQuestionIndex(newSession.current_question_index);
          setSelectedAnswer(null);
          setLastResult(null);
        }

        if (newSession.current_state === 'QUESTION_ACTIVE') {
          setQuestionStartTime(Date.now());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, currentQuestionIndex, supabase]);

  // Set question start time when question becomes active
  useEffect(() => {
    if (currentState === 'QUESTION_ACTIVE') {
      setQuestionStartTime(Date.now());
    }
  }, [currentState, currentQuestionIndex]);

  // Fetch leaderboard when state is SHOW_LEADERBOARD
  useEffect(() => {
    if (currentState === 'SHOW_LEADERBOARD') {
      const fetchLeaderboard = async () => {
        const data = await getLeaderboard(session.id);
        setLeaderboard(data);
      };
      fetchLeaderboard();
    }
  }, [currentState, session.id]);

  const handleAnswer = async (optionIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedAnswer(optionIndex);
    setSubmitError(null);

    const timeTaken = questionStartTime ? Date.now() - questionStartTime : 0;

    try {
      const result = await submitAnswer(
        session.id,
        participant.id,
        currentQuestionIndex,
        optionIndex,
        timeTaken
      );

      if (result.success) {
        setLastResult({
          isCorrect: result.isCorrect ?? false,
          points: result.pointsEarned ?? 0
        });
        if (result.totalScore !== undefined) setScore(result.totalScore);
        if (result.newStreak !== undefined) setStreak(result.newStreak);
      } else {
        setSubmitError(result.error || 'Kunde inte skicka svar');
      }
    } catch (err) {
      console.error('Submit answer exception:', err);
      setSubmitError('Ett oväntat fel uppstod');
    }

    setIsSubmitting(false);
  };

  // Render based on current state
  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="font-bold">{participant.nickname}</span>
          {streak >= 3 && (
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4" />
              {streak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-indigo-600 px-3 py-1.5 rounded-full">
          <Trophy className="w-4 h-4" />
          <span className="font-bold">{score}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentState === 'WAITING_FOR_HOST' && (
          <WaitingView nickname={participant.nickname} />
        )}

        {currentState === 'COUNTDOWN' && (
          <CountdownView />
        )}

        {currentState === 'QUESTION_ACTIVE' && currentQuestion && (
          <QuestionActiveView
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isSubmitting={isSubmitting}
            onAnswer={handleAnswer}
          />
        )}

        {currentState === 'SHOW_ANSWER' && (
          <ResultView
            lastResult={lastResult}
            selectedAnswer={selectedAnswer}
            correctAnswer={currentQuestion?.options.findIndex(o => o.isCorrect) ?? -1}
            score={score}
            streak={streak}
            error={submitError}
          />
        )}

        {currentState === 'SHOW_LEADERBOARD' && (
          <PlayerLeaderboardView
            leaderboard={leaderboard}
            myId={participant.id}
            onExit={() => router.push(exitPath)}
            isFinished={sessionStatus === 'FINISHED'}
          />
        )}
      </div>
    </div>
  );
}

// Waiting View
function WaitingView({ nickname }: { nickname: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 mx-auto bg-indigo-600 rounded-full flex items-center justify-center animate-pulse">
        <span className="text-3xl font-bold">{nickname.charAt(0).toUpperCase()}</span>
      </div>
      <h2 className="text-2xl font-bold">Du är med!</h2>
      <p className="text-slate-400">Väntar på att värden ska starta...</p>
      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// Countdown View
function CountdownView() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="text-center">
      <div className="text-9xl font-bold animate-pulse">
        {count > 0 ? count : '🎯'}
      </div>
      <p className="text-slate-400 mt-4">Gör dig redo!</p>
    </div>
  );
}

// Question Active View - Answer Buttons
function QuestionActiveView({
  question,
  selectedAnswer,
  isSubmitting,
  onAnswer
}: {
  question: Question;
  selectedAnswer: number | null;
  isSubmitting: boolean;
  onAnswer: (index: number) => void;
}) {
  const filledOptions = question.options.filter(o => o.text.trim());
  const hasAnswered = selectedAnswer !== null;

  return (
    <div className="w-full max-w-lg space-y-4">
      {hasAnswered ? (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-400" />
          <p className="text-slate-400 mt-4">Väntar på resultat...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filledOptions.map((option, index) => {
            const realIndex = question.options.indexOf(option);
            const color = ANSWER_COLORS[realIndex];

            return (
              <button
                key={realIndex}
                onClick={() => onAnswer(realIndex)}
                disabled={isSubmitting}
                className={`${color.bg} ${color.hover} ${color.text} p-6 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50`}
              >
                <span className="text-2xl opacity-60">{color.icon}</span>
                {option.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Result View
function ResultView({
  lastResult,
  selectedAnswer,
  correctAnswer,
  score,
  streak,
  error
}: {
  lastResult: { isCorrect: boolean; points: number } | null;
  selectedAnswer: number | null;
  correctAnswer: number;
  score: number;
  streak: number;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <X className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-400">Något gick fel</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  if (!lastResult) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Du svarade inte i tid</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      {lastResult.isCorrect ? (
        <>
          <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <Check className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-green-400">Rätt!</h2>
          <p className="text-4xl font-bold text-yellow-400">+{lastResult.points}</p>
          {streak >= 3 && (
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Flame className="w-6 h-6" />
              <span className="text-xl font-bold">{streak} i rad!</span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-red-400">Fel</h2>
          <p className="text-slate-400">
            Rätt svar var {ANSWER_COLORS[correctAnswer]?.icon}
          </p>
        </>
      )}

      <div className="pt-4 border-t border-slate-700">
        <p className="text-slate-400">Dina poäng</p>
        <p className="text-4xl font-bold">{score}</p>
      </div>
    </div>
  );
}

// Leaderboard View
function PlayerLeaderboardView({
  leaderboard,
  myId,
  onExit,
  isFinished
}: {
  leaderboard: LeaderboardEntry[];
  myId: string;
  onExit: () => void;
  isFinished: boolean;
}) {
  const top3 = leaderboard.slice(0, 3);
  const myEntry = leaderboard.find(e => e.participant_id === myId);

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        {isFinished ? '🎉 Slutresultat 🎉' : 'Topplista'}
      </h2>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 mb-8">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="text-center flex-1">
              <div className="w-full h-24 bg-slate-700 rounded-t-lg flex flex-col items-center justify-end pb-2">
                <span className="text-2xl">🥈</span>
                <span className="text-xs font-bold truncate w-full px-1">{top3[1].nickname}</span>
                <span className="text-xs text-slate-400">{top3[1].score}</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="text-center flex-1">
              <div className="w-full h-32 bg-yellow-600 rounded-t-lg flex flex-col items-center justify-end pb-2 shadow-lg shadow-yellow-900/20">
                <span className="text-4xl mb-1">🥇</span>
                <span className="text-sm font-bold truncate w-full px-1">{top3[0].nickname}</span>
                <span className="text-xs text-yellow-100">{top3[0].score}</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="text-center flex-1">
              <div className="w-full h-20 bg-amber-800 rounded-t-lg flex flex-col items-center justify-end pb-2">
                <span className="text-xl">🥉</span>
                <span className="text-xs font-bold truncate w-full px-1">{top3[2].nickname}</span>
                <span className="text-xs text-amber-200">{top3[2].score}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Position */}
      {myEntry && (
        <div className="bg-indigo-600 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold w-8 text-center">#{myEntry.rank}</span>
            <div className="flex flex-col">
              <span className="font-bold">Du</span>
              <span className="text-xs text-indigo-200">{myEntry.score} poäng</span>
            </div>
          </div>
          {myEntry.streak >= 3 && (
            <div className="flex items-center gap-1 text-orange-300">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{myEntry.streak}</span>
            </div>
          )}
        </div>
      )}

      {/* Exit Button */}
      {isFinished && (
        <button
          onClick={onExit}
          className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mt-8"
        >
          <X className="w-5 h-5" />
          Lämna quiz
        </button>
      )}

      {!isFinished && (
        <div className="text-center text-slate-400 animate-pulse mt-8">
          Väntar på nästa fråga...
        </div>
      )}
    </div>
  );
}
