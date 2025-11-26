'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { joinSession } from '@/app/staff/quiz/actions';

interface QuizJoinClientProps {
  profileId: string;
  alias: string;
}

export default function QuizJoinClient({ alias }: QuizJoinClientProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState(alias);
  const [step, setStep] = useState<'pin' | 'nickname'>('pin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinSubmit = () => {
    if (pin.length !== 6) {
      setError('PIN-koden måste vara 6 siffror');
      return;
    }
    setError('');
    setStep('nickname');
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError('Ange ett smeknamn');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await joinSession(pin, nickname.trim(), false);

    if (result.success) {
      router.push(`/app/quiz/play/${result.sessionId}?participant=${result.participantId}`);
    } else {
      setError(result.error || 'Något gick fel');
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
    setError('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Quiz</h1>
          <p className="text-white/80">
            {step === 'pin' ? 'Ange PIN-koden från skärmen' : 'Välj ditt smeknamn'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {step === 'pin' ? (
            <div className="space-y-6">
              {/* PIN Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">PIN-kod</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="000000"
                  className="text-center text-4xl font-bold tracking-[0.5em] h-16 border-2"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (num === 'del') {
                        setPin(pin.slice(0, -1));
                      } else if (num !== null) {
                        handlePinChange(pin + num);
                      }
                    }}
                    disabled={num === null}
                    className={`h-14 rounded-xl font-bold text-xl transition-all ${
                      num === null
                        ? 'invisible'
                        : num === 'del'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-95'
                    }`}
                  >
                    {num === 'del' ? '⌫' : num}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handlePinSubmit}
                disabled={pin.length !== 6}
                className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700"
              >
                Fortsätt
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setStep('pin')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka
              </button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Smeknamn</label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ditt smeknamn"
                  className="text-center text-2xl font-bold h-14"
                  maxLength={20}
                  autoFocus
                />
                <p className="text-xs text-slate-500 text-center">
                  Detta visas för andra spelare
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleJoin}
                disabled={isLoading || !nickname.trim()}
                className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Går med...
                  </>
                ) : (
                  <>
                    Gå med i spelet
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/app/aktiviteter"
            className="text-white/80 hover:text-white text-sm"
          >
            ← Tillbaka till appen
          </Link>
        </div>
      </div>
    </div>
  );
}
