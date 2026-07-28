/**
 * Supabase client for database operations.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Type definitions for database tables.
 */
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
  old_selector?: string;
  new_selector: string;
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

/**
 * Database helper functions.
 */
export async function getSelector(selectorId: string): Promise<Selector | null> {
  const { data, error } = await supabase
    .from("selectors")
    .select("*")
    .eq("id", selectorId)
    .single();

  if (error) {
    console.error(`Error fetching selector ${selectorId}:`, error);
    return null;
  }

  return data;
}

export async function getSelectors(selectorIds: string[]): Promise<Selector[]> {
  const { data, error } = await supabase
    .from("selectors")
    .select("*")
    .in("id", selectorIds);

  if (error) {
    console.error("Error fetching selectors:", error);
    return [];
  }

  return data || [];
}

export async function getLatestSnapshot(siteUrl: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("site_url", siteUrl)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
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
    .from("selector_versions")
    .select("*")
    .eq("selector_id", selectorId)
    .order("created_at", { ascending: false })
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
    .from("selectors")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectorId);

  if (error) {
    console.error(`Error updating selector ${selectorId}:`, error);
    return false;
  }

  return true;
}

export async function createSelectorVersion(
  version: Omit<SelectorVersion, "id" | "created_at">
): Promise<SelectorVersion | null> {
  const { data, error } = await supabase
    .from("selector_versions")
    .insert([version])
    .select()
    .single();

  if (error) {
    console.error("Error creating selector version:", error);
    return null;
  }

  return data;
}

export async function createChangeLog(log: Omit<ChangeLog, "id">): Promise<ChangeLog | null> {
  const { data, error } = await supabase
    .from("change_logs")
    .insert([log])
    .select()
    .single();

  if (error) {
    console.error("Error creating change log:", error);
    return null;
  }

  return data;
}

export async function saveSnapshot(siteUrl: string, snapshotData: any): Promise<boolean> {
  const { error } = await supabase
    .from("snapshots")
    .insert([
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
