import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COOLDOWN_SECONDS = 60;

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) {
    return 'Too many requests — please wait a few minutes before trying again.';
  }
  if (m.includes('invalid') || m.includes('expired') || m.includes('otp')) {
    return 'Incorrect or expired code. Please check your email and try again.';
  }
  return msg;
}

export default function Login() {
  const { signInWithEmail, verifyOtp } = useAuth();

  // Step 1 state
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Step 2 state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? (clearInterval(id), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]);

  // Focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || sendLoading) return;
    setSendError('');
    setSendLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setSendLoading(false);
    if (error) {
      setSendError(friendlyError(error.message));
    } else {
      setCooldown(COOLDOWN_SECONDS);
      setOtp(['', '', '', '', '', '']);
      setVerifyError('');
      setStep('otp');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || sendLoading) return;
    setSendError('');
    setSendLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setSendLoading(false);
    if (error) {
      setVerifyError(friendlyError(error.message));
    } else {
      setCooldown(COOLDOWN_SECONDS);
      setOtp(['', '', '', '', '', '']);
      setVerifyError('');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setVerifyError('');
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (digit && index === 5 && next.every(Boolean)) {
      handleVerify(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? '';
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) handleVerify(pasted);
  };

  const handleVerify = async (code?: string) => {
    const token = code ?? otp.join('');
    if (token.length < 6 || verifyLoading) return;
    setVerifyError('');
    setVerifyLoading(true);
    const { error } = await verifyOtp(email.trim(), token);
    setVerifyLoading(false);
    if (error) {
      setVerifyError(friendlyError(error.message));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    // On success, onAuthStateChange fires → AuthContext updates → AppShell shows Home
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-5"
          >
            <Sparkles className="w-4 h-4" />
            Smart Spending
          </motion.div>
          <h1 className="text-5xl font-bold text-foreground font-display tracking-tight">
            Clarity<span className="text-primary">Spend</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm font-medium">
            Track expenses. Make smarter decisions.
          </p>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <div className="h-1 w-full bg-primary" />
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSendCode}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-foreground">Welcome back</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter your email and we'll send a 6-digit sign-in code.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1.5 text-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setSendError(''); }}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {sendError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {sendError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={sendLoading || !email.trim() || cooldown > 0}
                  >
                    {sendLoading
                      ? 'Sending code…'
                      : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Send code'}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    No account yet? A code will create one automatically.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setVerifyError(''); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <h2 className="text-base font-bold text-foreground">Enter your code</h2>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
                    </p>
                  </div>

                  {/* OTP boxes */}
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={[
                          'w-10 h-12 text-center text-lg font-bold rounded-lg border-2 bg-background outline-none transition-colors',
                          'focus:border-primary focus:ring-0',
                          digit ? 'border-primary/60 text-foreground' : 'border-border text-muted-foreground',
                          verifyError ? 'border-red-400' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  {verifyError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                      {verifyError}
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleVerify()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={verifyLoading || otp.some((d) => !d)}
                  >
                    {verifyLoading ? 'Verifying…' : 'Verify code'}
                  </Button>

                  <div className="text-center">
                    {cooldown > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Resend in <span className="font-semibold tabular-nums">{cooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={sendLoading}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        {sendLoading ? 'Sending…' : "Didn't get a code? Resend"}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
