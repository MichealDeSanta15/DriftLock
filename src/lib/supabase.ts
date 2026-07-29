import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth types and functions
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign up failed: no user returned');

  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed: no user returned');

  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    callback({
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata,
    });
  });

  return () => data?.subscription?.unsubscribe();
}

// Database types
export interface Selector {
  id: string;
  site_id: string;
  selector_key: string;
  is_current: boolean;
  repair_count: number;
  created_at: string;
  updated_at: string;
}

export interface SelectorVersion {
  id: number;
  selector_id: string;
  selector_value: string;
  version_number: number;
  created_at: string;
  is_backup: boolean;
  confidence_score: number;
}

export interface ChangeLog {
  id: number;
  selector_id: string;
  version_id?: number;
  old_selector?: string | null;
  new_selector?: string | null;
  detection_method?: string;
  repair_method?: string;
  detection_timestamp: string;
  repair_timestamp?: string;
  repair_status: string;
  validation_score?: number;
  error_message?: string;
}

export interface Snapshot {
  id: number;
  site_url: string;
  data: {
    script_hashes: Record<string, string>;
    pages: Record<string, string>;
  };
  created_at: string;
}

// Database helpers
export async function getSelector(selectorId: string): Promise<Selector | null> {
  const { data, error } = await supabase
    .from('selectors')
    .select('*')
    .eq('id', selectorId)
    .single();

  if (error) {
    console.error(`Error fetching selector ${selectorId}:`, error);
    return null;
  }

  return data;
}

export async function getSelectors(selectorIds: string[]): Promise<Selector[]> {
  const { data, error } = await supabase
    .from('selectors')
    .select('*')
    .in('id', selectorIds);

  if (error) {
    console.error('Error fetching selectors:', error);
    return [];
  }

  return data || [];
}

export async function getLatestSnapshot(siteUrl: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('site_url', siteUrl)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching snapshot for ${siteUrl}:`, error);
    return null;
  }

  return data || null;
}

export async function getRecentVersions(
  selectorId: string,
  limit: number = 3
): Promise<SelectorVersion[]> {
  const { data, error } = await supabase
    .from('selector_versions')
    .select('*')
    .eq('selector_id', selectorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching versions for ${selectorId}:`, error);
    return [];
  }

  return data || [];
}

export async function updateSelector(
  selectorId: string,
  updates: Partial<Selector>
): Promise<boolean> {
  const { error } = await supabase
    .from('selectors')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', selectorId);

  if (error) {
    console.error(`Error updating selector ${selectorId}:`, error);
    return false;
  }

  return true;
}

export async function createSelectorVersion(
  version: Omit<SelectorVersion, 'id' | 'created_at'>
): Promise<SelectorVersion | null> {
  const { data, error } = await supabase
    .from('selector_versions')
    .insert([version])
    .select()
    .single();

  if (error) {
    console.error('Error creating selector version:', error);
    return null;
  }

  return data;
}

export async function createChangeLog(log: Omit<ChangeLog, 'id'>): Promise<ChangeLog | null> {
  const { data, error } = await supabase
    .from('change_logs')
    .insert([log])
    .select()
    .single();

  if (error) {
    console.error('Error creating change log:', error);
    return null;
  }

  return data;
}

export async function saveSnapshot(
  siteUrl: string,
  snapshotData: { script_hashes: Record<string, string>; pages: Record<string, string> }
): Promise<boolean> {
  const { error } = await supabase.from('snapshots').insert([
    {
      site_url: siteUrl,
      data: snapshotData,
    },
  ]);

  if (error) {
    console.error(`Error saving snapshot for ${siteUrl}:`, error);
    return false;
  }

  return true;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  owner_id: string;
}

export async function getSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching sites:', error);
    return [];
  }

  return data || [];
}
