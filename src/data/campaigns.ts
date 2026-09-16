import { useEffect, useSyncExternalStore } from 'react';
import { api, type ApiCampaign } from '../api';

let campaigns: ApiCampaign[] = [];
let loadState: 'idle' | 'loading' | 'loaded' = 'idle';
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function getSnapshot(): ApiCampaign[] {
  return campaigns;
}

/**
 * Fetch campaigns from the backend once and cache them in memory.
 * On localhost (or when the API is unreachable) this fails silently and
 * returns an empty list, so the UI degrades gracefully instead of erroring.
 */
export async function ensureCampaignsLoaded(): Promise<ApiCampaign[]> {
  if (loadState === 'loaded') return campaigns;
  if (loadState === 'loading') return campaigns;
  loadState = 'loading';
  try {
    const res = await api.listCampaigns();
    campaigns = res.data ?? [];
  } catch {
    campaigns = [];
  } finally {
    loadState = 'loaded';
    emit();
  }
  return campaigns;
}

export function getCampaigns(): ApiCampaign[] {
  return campaigns;
}

/** Resolve a campaign's display name by id ('' when unknown). */
export function campaignNameById(id?: number): string {
  if (id === undefined || id === null) return '';
  return campaigns.find((c) => c.id === id)?.name ?? '';
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useCampaigns(): ApiCampaign[] {
  useEffect(() => {
    void ensureCampaignsLoaded();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot);
}