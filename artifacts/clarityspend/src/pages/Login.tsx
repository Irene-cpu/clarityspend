import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-base font-bold text-foreground">Check your inbox</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We sent a magic link to <strong className="text-foreground">{email}</strong>.
                  Click it to sign in — no password needed.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="mt-4 text-xs text-primary hover:underline"
                >
                  Use a different email
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Welcome back</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your email and we'll send a sign-in link.
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
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
