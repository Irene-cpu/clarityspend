import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, MailCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COOLDOWN_SECONDS = 60;

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) {
    return 'Too many requests — please wait a few minutes before trying again.';
  }
  return msg;
}

export default function Login() {
  const { signInWithEmail } = useAuth();

  const [email, setEmail]         = useState('');
  const [step, setStep]           = useState<'email' | 'sent'>('email');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [cooldown, setCooldown]   = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? (clearInterval(id), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown > 0]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || cooldown > 0) return;
    setError('');
    setLoading(true);
    const { error: err } = await signInWithEmail(email.trim());
    setLoading(false);
    if (err) {
      setError(friendlyError(err.message));
    } else {
      setCooldown(COOLDOWN_SECONDS);
      setStep('sent');
    }
  };

  const handleResend = async () => {
    if (loading || cooldown > 0) return;
    setError('');
    setLoading(true);
    const { error: err } = await signInWithEmail(email.trim());
    setLoading(false);
    if (err) {
      setError(friendlyError(err.message));
    } else {
      setCooldown(COOLDOWN_SECONDS);
    }
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

              {/* Step 1 — email input */}
              {step === 'email' && (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSend}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-bold text-foreground">Welcome back</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter your email and we'll send you a magic link to sign in.
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
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? 'Sending link…' : 'Send magic link'}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    No account yet? A link will create one automatically.
                  </p>
                </motion.form>
              )}

              {/* Step 2 — sent confirmation */}
              {step === 'sent' && (
                <motion.div
                  key="sent-step"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  {/* Icon */}
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <MailCheck className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-base font-bold text-foreground">Check your inbox</h2>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        We sent a magic link to{' '}
                        <strong className="text-foreground">{email}</strong>.
                        Click it to sign in — no code needed.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                      {error}
                    </p>
                  )}

                  {/* Resend */}
                  <div className="text-center pt-1">
                    {cooldown > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Resend available in{' '}
                        <span className="font-semibold tabular-nums">{cooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        {loading ? 'Sending…' : "Didn't get it? Resend the link"}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    The link expires after 60 minutes. Check your spam folder if you don't see it.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
