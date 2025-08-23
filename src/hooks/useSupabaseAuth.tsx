
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  ward: number | null;
};

export function useSupabaseAuth() {
  const [session, setSession] = useState<ReturnType<typeof supabase.auth.getSession> extends Promise<infer R> ? any : any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;
  const role = profile?.role ?? 'public';

  const loadSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, ward')
      .eq('id', user.id)
      .single();
    if (!error) setProfile(data as Profile);
    else console.warn('Failed to load profile', error);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadSession().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, [loadSession]);

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user?.id, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, first_name?: string, last_name?: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name } },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ session, user, profile, role, loading, signIn, signUp, signOut, refreshProfile: loadProfile }),
    [session, user, profile, role, loading, signIn, signUp, signOut, loadProfile]
  );

  return value;
}

export type UseSupabaseAuth = ReturnType<typeof useSupabaseAuth>;
