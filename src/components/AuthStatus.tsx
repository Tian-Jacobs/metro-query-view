
import React from 'react';
import { Button } from '@/components/ui/button';

interface AuthStatusProps {
  email?: string | null;
  role?: string;
  onSignInClick: () => void;
  onSignOut: () => void;
  loading?: boolean;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ email, role, onSignInClick, onSignOut, loading }) => {
  if (loading) {
    return <div className="text-sm opacity-70">Loading…</div>;
  }

  if (!email) {
    return (
      <Button variant="outline" onClick={onSignInClick}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <span className="font-medium">{email}</span>
        {role ? <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">{role}</span> : null}
      </div>
      <Button variant="outline" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
};

export default AuthStatus;
