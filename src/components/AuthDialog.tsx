
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<any>;
  onSignUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<any>;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange, onSignIn, onSignUp }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await onSignIn(email, password);
        if (error) throw error;
        toast({ title: 'Signed in', description: 'Welcome back.' });
        onOpenChange(false);
      } else {
        const { error } = await onSignUp(email, password, firstName || undefined, lastName || undefined);
        if (error) throw error;
        toast({ title: 'Account created', description: 'You are now signed in.' });
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({ title: 'Authentication failed', description: err?.message ?? 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'signin' ? 'Sign in' : 'Create an account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {mode === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" value={firstName} onChange={(e) => setFirst(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" value={lastName} onChange={(e) => setLast(e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm underline underline-offset-4"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Have an account? Sign in'}
            </button>
          </div>
        </form>
        <p className="text-xs opacity-70">
          Note: Only staff/admin accounts can generate charts. Ask an administrator to assign your role.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
