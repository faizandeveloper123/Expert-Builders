import { useSyncExternalStore } from 'react';
import type { ApiFollower } from '../api';

export interface ContactOwnerState {
  /** staff id of the assigned owner, or null when unassigned. */
  assignedTo: number | null;
  /** owner display name (falls back to 'Unassigned'). */
  ownerName: string | null;
  /** owner avatar data URL, or null. */
  ownerAvatar: string | null;
}

/**
 * Lightweight client-side store of per-contact state (followers + owner) so the
 * contacts table reflects changes immediately, without a full page refresh,
 * when followers are added/removed or a lead is assigned/unassigned on the
 * lead's detail view.
 */
let followersByContact: Record<number, ApiFollower[]> = {};
let ownersByContact: Record<number, ContactOwnerState> = {};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

let followersSnapshot: Record<number, ApiFollower[]> | null = null;
function getFollowersSnapshot(): Record<number, ApiFollower[]> {
  if (followersSnapshot === null) followersSnapshot = followersByContact;
  return followersSnapshot;
}

let ownersSnapshot: Record<number, ContactOwnerState> | null = null;
function getOwnersSnapshot(): Record<number, ContactOwnerState> {
  if (ownersSnapshot === null) ownersSnapshot = ownersByContact;
  return ownersSnapshot;
}

/** Seed the store from a freshly loaded contact (merges, never drops existing). */
export function seedContactFollowers(contactId: number, list: ApiFollower[]): void {
  followersByContact = { ...followersByContact, [contactId]: list };
  followersSnapshot = null;
  emit();
}

/** Replace the follower list for a contact (called right after add/remove). */
export function setContactFollowers(contactId: number, list: ApiFollower[]): void {
  followersByContact = { ...followersByContact, [contactId]: list };
  followersSnapshot = null;
  emit();
}

/** Seed the owner state for a contact from a freshly loaded contact. */
export function seedContactOwner(contactId: number, state: ContactOwnerState): void {
  ownersByContact = { ...ownersByContact, [contactId]: state };
  ownersSnapshot = null;
  emit();
}

/** Update the owner for a contact (called right after assign/unassign). */
export function setContactOwner(contactId: number, state: ContactOwnerState): void {
  ownersByContact = { ...ownersByContact, [contactId]: state };
  ownersSnapshot = null;
  emit();
}

export function getContactFollowers(contactId: number): ApiFollower[] {
  return followersByContact[contactId] ?? [];
}

export function getContactOwner(contactId: number): ContactOwnerState | null {
  return ownersByContact[contactId] ?? null;
}

/** Hook for components (e.g. the contacts table) that render many rows. */
export function useFollowers(): Record<number, ApiFollower[]> {
  return useSyncExternalStore(subscribe, getFollowersSnapshot);
}

export function useOwners(): Record<number, ContactOwnerState> {
  return useSyncExternalStore(subscribe, getOwnersSnapshot);
}
