'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gamepad2, ArrowRight, ArrowLeft, Loader2, LogIn, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { joinSession } from '@/app/staff/quiz/actions';
import { createClient } from '@/utils/supabase/client';

function GuestJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get('pin') || '';

  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'pin' | 'nickname' | 'confirm-user' | 'loading'>(initialPin ? 'loading' : 'pin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('alias, id')
          .eq('user_id', user.id)
          .single();
        setProfile(profile);
      }

      setIsCheckingAuth(false);

      // If we have a PIN, decide next step based on auth
      if (initialPin) {
        setStep(user ? 'confirm-user' : 'nickname');
      } else {
        setStep('pin');
      }
    };

    checkAuth();
  }, [initialPin]);

  const handlePinSubmit = () => {
    if (pin.length !== 6) {
      setError('PIN-koden måste vara 6 siffror');
      return;
    }
    setError('');
    setStep(user ? 'confirm-user' : 'nickname');
  };

  const handleJoin = async () => {
    const isGuest = !user;
    const displayName = isGuest ? nickname.trim() : (profile?.alias || 'Anonym');

    if (isGuest) {
      if (!displayName) {
        setError('Ange ett smeknamn');
        return;
      }
      if (displayName.length < 2) {
        setError('Smeknamnet måste vara minst 2 tecken');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    // Join session
    const result = await joinSession(pin, displayName, isGuest);

    if (result.success) {
      if (isGuest) {
        // Store guest info in sessionStorage
        sessionStorage.setItem('quiz_guest', JSON.stringify({
          participantId: result.participantId,
          sessionId: result.sessionId,
          nickname: displayName
        }));
      }
      router.push(`/join/play?session=${result.sessionId}&participant=${result.participantId}`);
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setStep('nickname');
  };

  if (isCheckingAuth || step === 'loading') {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Quiz</h1>
          <p className="text-white/80">
            {step === 'pin' ? 'Ange PIN-koden från skärmen' :
              step === 'confirm-user' ? 'Bekräfta din identitet' :
                'Välj ditt smeknamn'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {step === 'pin' && (
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
                    className={`h-14 rounded-xl font-bold text-xl transition-all ${num === null
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
          )}

          {step === 'confirm-user' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('pin')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Byt PIN-kod
              </button>

              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profile?.alias || 'Inloggad användare'}</h3>
                  <p className="text-slate-500">Du är inloggad</p>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Går med...
                  </>
                ) : (
                  <>
                    Gå med som {profile?.alias}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 mx-auto"
                >
                  <LogOut className="w-4 h-4" />
                  Logga ut och gå med som gäst
                </button>
              </div>
            </div>
          )}

          {step === 'nickname' && (
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
                    Gå med som gäst
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Links */}
        {!user && (
          <div className="text-center mt-6 space-y-2">
            <p className="text-white/60 text-sm">
              Är du medlem?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white hover:text-white/80 font-medium"
            >
              <LogIn className="w-4 h-4" />
              Logga in för att delta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    }>
      <GuestJoinContent />
    </Suspense>
  );
}
