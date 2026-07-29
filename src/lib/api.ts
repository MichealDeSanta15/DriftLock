const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export type SelectorHealthStatus = 'working' | 'broken' | 'failed';

export interface Site {
  id: string;
  name: string;
  url: string;
  status: SelectorHealthStatus;
  lastChecked: string;
  selectorId: string;
  currentSelector: string;
  lastRepaired?: string;
}

export interface DetectionResult {
  site_id: string;
  detected_at: string;
  signal_type: string;
  confidence: number;
  metadata: Record<string, unknown>;
  detected?: boolean;
}

export interface SelectorUpdate {
  id: string;
  selector_key: string;
  current_value: string;
  version: number;
  last_updated: string;
}

export interface APIError {
  error: string;
  details?: Record<string, unknown>;
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API request failed: ${response.statusText}. ${
        (errorData as APIError).error || ''
      }`
    );
  }

  return response.json() as Promise<T>;
}

export async function getSites(): Promise<Site[]> {
  const response = await fetchAPI<{ sites: Site[] }>('/api/sites');
  return response.sites;
}

export async function triggerDetection(siteId: string): Promise<DetectionResult> {
  return fetchAPI<DetectionResult>('/api/sites/detect', {
    method: 'POST',
    body: JSON.stringify({ site_id: siteId }),
  });
}

export async function getCurrentSelector(
  selectorId: string
): Promise<SelectorUpdate> {
  return fetchAPI<SelectorUpdate>(`/api/selectors/${selectorId}/current`);
}

export async function listDetections(siteId?: string): Promise<DetectionResult[]> {
  const params = new URLSearchParams();
  if (siteId) params.append('site_id', siteId);

  return fetchAPI<DetectionResult[]>(
    `/api/detections${params.toString() ? `?${params}` : ''}`
  );
}

export async function getSelectorHistory(selectorId: string): Promise<SelectorUpdate[]> {
  return fetchAPI<SelectorUpdate[]>(`/api/selectors/${selectorId}/history`);
}
