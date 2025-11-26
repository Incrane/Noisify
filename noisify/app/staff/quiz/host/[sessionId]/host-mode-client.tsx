'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Play, Users, Trophy, SkipForward, XCircle, Copy, Check, BarChart3, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateSessionState, endSession, getLeaderboard } from '../../actions';
import { QuizOption, QuizParticipant, LeaderboardEntry } from '@/types/quiz';
// QR Code component - simple inline implementation
const QRCodeDisplay = ({ value, size }: { value: string; size: number }) => (
  <div className="flex items-center justify-center" style={{ width: size, height: size }}>
    <div className="text-center text-slate-600 text-sm">
      <div className="text-4xl mb-2">📱</div>
      <p>Scanna QR-koden</p>
      <p className="text-xs mt-1 break-all">{value}</p>
    </div>
  </div>
);

interface Question {
  id: string;
  question_text: string;
  time_limit_seconds: number;
  order_index: number;
  options: QuizOption[];
}

interface SessionData {
  id: string;
  pin_code: string;
  status: string;
  access_policy: string;
  current_question_index: number;
  current_state: string;
  org_name: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

interface HostModeClientProps {
  session: SessionData;
  quiz: QuizData;
  initialParticipants: QuizParticipant[];
}

const ANSWER_COLORS = [
  { bg: 'bg-red-500', text: 'text-white', icon: '▲' },
  { bg: 'bg-blue-500', text: 'text-white', icon: '◆' },
  { bg: 'bg-yellow-400', text: 'text-black', icon: '●' },
  { bg: 'bg-green-500', text: 'text-white', icon: '■' }
];

export default function HostModeClient({ session, quiz, initialParticipants }: HostModeClientProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [participants, setParticipants] = useState<QuizParticipant[]>(initialParticipants);
  const [currentState, setCurrentState] = useState(session.current_state);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.current_question_index);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerCounts, setAnswerCounts] = useState<number[]>([0, 0, 0, 0]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = currentQuestionIndex >= 0 ? quiz.questions[currentQuestionIndex] : null;
  const totalQuestions = quiz.questions.length;
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?pin=${session.pin_code}`;

  // Define fetchAnswerCounts before useEffect
  const fetchAnswerCounts = useCallback(async () => {
    if (currentQuestionIndex < 0) return;

    const { data } = await supabase
      .from('quiz_answers')
      .select('selected_option')
      .eq('session_id', session.id)
      .eq('question_index', currentQuestionIndex);

    if (data) {
      const counts = [0, 0, 0, 0];
      data.forEach(a => {
        if (a.selected_option >= 0 && a.selected_option < 4) {
          counts[a.selected_option]++;
        }
      });
      setAnswerCounts(counts);
    }
  }, [currentQuestionIndex, session.id, supabase]);

  const fetchLeaderboard = async () => {
    const lb = await getLeaderboard(session.id);
    setLeaderboard(lb);
  };

  const copyPin = async () => {
    await navigator.clipboard.writeText(session.pin_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    setIsLoading(true);
    await updateSessionState(session.id, {
      status: 'IN_PROGRESS',
      current_question_index: 0,
      current_state: 'COUNTDOWN'
    });
    setCurrentQuestionIndex(0);
    setCurrentState('COUNTDOWN');
    
    // Show countdown for 3 seconds then start question
    setTimeout(async () => {
      await updateSessionState(session.id, {
        current_state: 'QUESTION_ACTIVE',
        question_started_at: new Date().toISOString()
      });
      setCurrentState('QUESTION_ACTIVE');
      setIsLoading(false);
    }, 3000);
  };

  // Define showAnswer before useEffect that uses it
  const showAnswer = useCallback(async () => {
    setIsLoading(true);
    await updateSessionState(session.id, {
      current_state: 'SHOW_ANSWER'
    });
    setCurrentState('SHOW_ANSWER');
    await fetchAnswerCounts();
    setIsLoading(false);
  }, [session.id, fetchAnswerCounts]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`quiz_session_${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_participants',
        filter: `session_id=eq.${session.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new as QuizParticipant]);
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new as QuizParticipant : p)
          );
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quiz_answers',
        filter: `session_id=eq.${session.id}`
      }, () => {
        // Update answer counts when new answers come in
        fetchAnswerCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, supabase, fetchAnswerCounts]);

  // Timer for questions - use ref to avoid setState in effect body
  useEffect(() => {
    if (currentState !== 'QUESTION_ACTIVE' || !currentQuestion) return;

    let remainingTime = currentQuestion.time_limit_seconds;
    setTimeLeft(remainingTime); // Initial set is intentional for timer sync
    
    const interval = setInterval(() => {
      remainingTime -= 1;
      if (remainingTime <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        showAnswer();
      } else {
        setTimeLeft(remainingTime);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, currentQuestionIndex]);

  const showLeaderboard = async () => {
    setIsLoading(true);
    await updateSessionState(session.id, {
      current_state: 'SHOW_LEADERBOARD'
    });
    setCurrentState('SHOW_LEADERBOARD');
    await fetchLeaderboard();
    setIsLoading(false);
  };

  const nextQuestion = async () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= totalQuestions) {
      // Game finished
      await endSession(session.id);
      setCurrentState('SHOW_LEADERBOARD');
      await fetchLeaderboard();
      return;
    }

    setIsLoading(true);
    setAnswerCounts([0, 0, 0, 0]);
    
    await updateSessionState(session.id, {
      current_question_index: nextIndex,
      current_state: 'COUNTDOWN'
    });
    setCurrentQuestionIndex(nextIndex);
    setCurrentState('COUNTDOWN');
    
    setTimeout(async () => {
      await updateSessionState(session.id, {
        current_state: 'QUESTION_ACTIVE',
        question_started_at: new Date().toISOString()
      });
      setCurrentState('QUESTION_ACTIVE');
      setIsLoading(false);
    }, 3000);
  };

  const handleEndGame = async () => {
    if (!confirm('Är du säker på att du vill avsluta quizen?')) return;
    await endSession(session.id);
    router.push('/staff/quiz');
  };

  // Render based on current state
  return (
    <div className="fixed inset-0 bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-linear-to-b from-slate-900 to-transparent">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          {currentQuestionIndex >= 0 && (
            <span className="text-slate-400">
              Fråga {currentQuestionIndex + 1} av {totalQuestions}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleEndGame} className="text-red-400 border-red-400 hover:bg-red-400/10">
            <XCircle className="w-4 h-4 mr-1" />
            Avsluta
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex items-center justify-center p-8 pt-20">
        {currentState === 'WAITING_FOR_HOST' && (
          <LobbyView
            pinCode={session.pin_code}
            joinUrl={joinUrl}
            participants={participants}
            accessPolicy={session.access_policy}
            orgName={session.org_name}
            onCopyPin={copyPin}
            copied={copied}
            onStart={startGame}
            isLoading={isLoading}
          />
        )}

        {currentState === 'COUNTDOWN' && (
          <CountdownView questionNumber={currentQuestionIndex + 1} />
        )}

        {currentState === 'QUESTION_ACTIVE' && currentQuestion && (
          <QuestionView
            question={currentQuestion}
            timeLeft={timeLeft}
            answerCount={answerCounts.reduce((a, b) => a + b, 0)}
            totalParticipants={participants.length}
            onSkip={showAnswer}
            isLoading={isLoading}
          />
        )}

        {currentState === 'SHOW_ANSWER' && currentQuestion && (
          <AnswerRevealView
            question={currentQuestion}
            answerCounts={answerCounts}
            totalParticipants={participants.length}
            onShowLeaderboard={showLeaderboard}
            onNextQuestion={nextQuestion}
            isLastQuestion={currentQuestionIndex >= totalQuestions - 1}
            isLoading={isLoading}
          />
        )}

        {currentState === 'SHOW_LEADERBOARD' && (
          <LeaderboardView
            leaderboard={leaderboard}
            onNextQuestion={nextQuestion}
            isGameOver={currentQuestionIndex >= totalQuestions - 1}
            onEndGame={() => router.push('/staff/quiz')}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// Lobby View
function LobbyView({
  pinCode,
  joinUrl,
  participants,
  accessPolicy,
  orgName,
  onCopyPin,
  copied,
  onStart,
  isLoading
}: {
  pinCode: string;
  joinUrl: string;
  participants: QuizParticipant[];
  accessPolicy: string;
  orgName: string;
  onCopyPin: () => void;
  copied: boolean;
  onStart: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center space-y-8 max-w-4xl mx-auto">
      <div>
        <p className="text-slate-400 mb-2">Gå med på</p>
        <p className="text-2xl text-indigo-400 font-mono">{joinUrl.replace('https://', '').replace('http://', '')}</p>
      </div>

      <div className="flex items-center justify-center gap-8">
        <div className="bg-white p-4 rounded-xl">
          <QRCodeDisplay value={joinUrl} size={180} />
        </div>
        
        <div className="text-left">
          <p className="text-slate-400 mb-1">PIN-kod</p>
          <div className="flex items-center gap-3">
            <span className="text-6xl font-bold tracking-wider">{pinCode}</span>
            <button
              onClick={onCopyPin}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {accessPolicy === 'OPEN' ? 'Öppen för alla' : `Endast ${orgName}`}
          </p>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            <Users className="w-5 h-5 inline mr-2" />
            Deltagare ({participants.length})
          </h3>
        </div>
        
        {participants.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className="px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full text-sm font-medium animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {p.nickname}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Väntar på deltagare...</p>
        )}
      </div>

      <Button
        onClick={onStart}
        disabled={participants.length === 0 || isLoading}
        size="lg"
        className="bg-green-500 hover:bg-green-600 text-xl px-12 py-6"
      >
        <Play className="w-6 h-6 mr-2" />
        Starta quiz
      </Button>
    </div>
  );
}

// Countdown View
function CountdownView({ questionNumber }: { questionNumber: number }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="text-center">
      <p className="text-2xl text-slate-400 mb-4">Fråga {questionNumber}</p>
      <div className="text-9xl font-bold animate-pulse">
        {count > 0 ? count : 'GO!'}
      </div>
    </div>
  );
}

// Question View
function QuestionView({
  question,
  timeLeft,
  answerCount,
  totalParticipants,
  onSkip,
  isLoading
}: {
  question: Question;
  timeLeft: number;
  answerCount: number;
  totalParticipants: number;
  onSkip: () => void;
  isLoading: boolean;
}) {
  const progress = (timeLeft / question.time_limit_seconds) * 100;

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Timer Bar */}
      <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            progress > 50 ? 'bg-green-500' : progress > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {timeLeft}s
        </div>
      </div>

      {/* Question */}
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-8">{question.question_text}</h2>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          option.text.trim() && (
            <div
              key={index}
              className={`${ANSWER_COLORS[index].bg} ${ANSWER_COLORS[index].text} p-6 rounded-xl text-2xl font-bold flex items-center gap-4`}
            >
              <span className="text-3xl opacity-60">{ANSWER_COLORS[index].icon}</span>
              {option.text}
            </div>
          )
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <BarChart3 className="w-5 h-5" />
          {answerCount} / {totalParticipants} har svarat
        </div>
        <Button onClick={onSkip} variant="outline" disabled={isLoading}>
          <SkipForward className="w-4 h-4 mr-2" />
          Visa svar
        </Button>
      </div>
    </div>
  );
}

// Answer Reveal View
function AnswerRevealView({
  question,
  answerCounts,
  totalParticipants,
  onShowLeaderboard,
  onNextQuestion,
  isLastQuestion,
  isLoading
}: {
  question: Question;
  answerCounts: number[];
  totalParticipants: number;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  isLoading: boolean;
}) {
  const maxCount = Math.max(...answerCounts, 1);
  const correctIndex = question.options.findIndex(o => o.isCorrect);

  return (
    <div className="w-full max-w-5xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">{question.question_text}</h2>
        <p className="text-green-400 text-xl">
          Rätt svar: {question.options[correctIndex]?.text}
        </p>
      </div>

      {/* Answer Distribution */}
      <div className="space-y-4">
        {question.options.map((option, index) => (
          option.text.trim() && (
            <div key={index} className="flex items-center gap-4">
              <div className={`w-16 h-16 ${ANSWER_COLORS[index].bg} rounded-lg flex items-center justify-center`}>
                <span className={`text-2xl ${ANSWER_COLORS[index].text}`}>{ANSWER_COLORS[index].icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${option.isCorrect ? 'text-green-400' : ''}`}>
                    {option.text} {option.isCorrect && '✓'}
                  </span>
                  <span>{answerCounts[index]} svar {totalParticipants > 0 && `(${Math.round((answerCounts[index] / totalParticipants) * 100)}%)`}</span>
                </div>
                <div className="h-8 bg-slate-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${ANSWER_COLORS[index].bg} transition-all duration-1000`}
                    style={{ width: `${(answerCounts[index] / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={onShowLeaderboard} variant="outline" disabled={isLoading}>
          <Trophy className="w-4 h-4 mr-2" />
          Visa topplista
        </Button>
        <Button onClick={onNextQuestion} className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
          {isLastQuestion ? (
            <>
              <Trophy className="w-4 h-4 mr-2" />
              Visa resultat
            </>
          ) : (
            <>
              <SkipForward className="w-4 h-4 mr-2" />
              Nästa fråga
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Leaderboard View
function LeaderboardView({
  leaderboard,
  onNextQuestion,
  isGameOver,
  onEndGame,
  isLoading
}: {
  leaderboard: LeaderboardEntry[];
  onNextQuestion: () => void;
  isGameOver: boolean;
  onEndGame: () => void;
  isLoading: boolean;
}) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <h2 className="text-4xl font-bold text-center mb-8">
        {isGameOver ? '🎉 Slutresultat 🎉' : 'Topplista'}
      </h2>

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="text-center">
              <div className="w-24 h-32 bg-linear-to-t from-slate-600 to-slate-500 rounded-t-xl flex flex-col items-center justify-end pb-4">
                <span className="text-4xl mb-2">🥈</span>
                <span className="font-bold truncate w-full px-2">{top3[1].nickname}</span>
                <span className="text-sm text-slate-300">{top3[1].score} p</span>
              </div>
            </div>
          )}
          
          {/* 1st Place */}
          {top3[0] && (
            <div className="text-center">
              <div className="w-28 h-44 bg-linear-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex flex-col items-center justify-end pb-4">
                <span className="text-5xl mb-2">🥇</span>
                <span className="font-bold truncate w-full px-2">{top3[0].nickname}</span>
                <span className="text-sm">{top3[0].score} p</span>
                {top3[0].streak > 0 && (
                  <span className="flex items-center gap-1 text-xs mt-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {top3[0].streak}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* 3rd Place */}
          {top3[2] && (
            <div className="text-center">
              <div className="w-24 h-24 bg-linear-to-t from-amber-800 to-amber-600 rounded-t-xl flex flex-col items-center justify-end pb-4">
                <span className="text-3xl mb-1">🥉</span>
                <span className="font-bold truncate w-full px-2 text-sm">{top3[2].nickname}</span>
                <span className="text-xs text-amber-200">{top3[2].score} p</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 max-h-60 overflow-y-auto">
          {rest.map((entry) => (
            <div key={entry.participant_id} className="flex items-center gap-4 py-2 border-b border-slate-700 last:border-0">
              <span className="w-8 text-center font-bold text-slate-400">{entry.rank}</span>
              <span className="flex-1 font-medium">{entry.nickname}</span>
              <span className="text-slate-400">{entry.score} p</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {isGameOver ? (
          <Button onClick={onEndGame} className="bg-indigo-600 hover:bg-indigo-700" size="lg">
            Avsluta och återgå
          </Button>
        ) : (
          <Button onClick={onNextQuestion} className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
            <SkipForward className="w-4 h-4 mr-2" />
            Nästa fråga
          </Button>
        )}
      </div>
    </div>
  );
}
