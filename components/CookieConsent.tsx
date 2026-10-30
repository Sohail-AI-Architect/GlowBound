'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';

/** localStorage key holding the visitor's advertising-cookie choice. */
export const AD_CONSENT_KEY = 'glowbound.consent.v1';

/** Window event dispatched whenever the stored choice changes. */
export const AD_CONSENT_EVENT = 'glowbound:consent';

export type AdConsent = 'granted' | 'denied';

/**
 * The stored choice, or null when the visitor has not decided yet.
 * Returns null during SSR so the server render never reads storage.
 */
export function readAdConsent(): AdConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(AD_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    // Storage unavailable (private mode, blocked cookies): treat as undecided.
    return null;
  }
}

/** Persist the choice and notify every subscriber (consent banner, ad loader). */
export function setAdConsent(value: AdConsent): void {
  try {
    window.localStorage.setItem(AD_CONSENT_KEY, value);
  } catch {
    // Even if storage fails, this page still honours the in-memory choice.
  }
  window.dispatchEvent(new CustomEvent<AdConsent>(AD_CONSENT_EVENT, { detail: value }));
}

/* --- subscription plumbing for useSyncExternalStore --------------------- */

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener(AD_CONSENT_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(AD_CONSENT_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function subscribeToNothing(): () => void {
  return () => {};
}

function getNullConsent(): null {
  return null;
}

function getHydrated(): boolean {
  return true;
}

function getServerHydrated(): boolean {
  return false;
}

/**
 * SSR-safe subscription to the advertising-cookie choice.
 *
 * The server snapshot is always null; the browser snapshot is the value in
 * localStorage, so hydration matches the server markup exactly and the stored
 * choice is picked up on the following render. Listens for both the in-page
 * consent event and cross-tab `storage` updates.
 */
export function useAdConsent(): AdConsent | null {
  return useSyncExternalStore(subscribeToConsent, readAdConsent, getNullConsent);
}

/**
 * True only in the browser after hydration, so components that must never
 * render during SSR (like this banner) can wait for the client safely without
 * forcing a state update inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, getHydrated, getServerHydrated);
}

const GOOGLE_COOKIE_POLICY = 'https://policies.google.com/technologies/cookies';
const GOOGLE_ADS_POLICY = 'https://policies.google.com/technologies/ads';

/**
 * Lightweight GDPR/UK notice shown until the visitor accepts or declines
 * advertising cookies. Declining keeps the whole game playable: it only means
 * no advertising scripts are loaded.
 */
export function CookieConsent() {
  const consent = useAdConsent();
  const hydrated = useHydrated();

  // Nothing during SSR, and nothing once a choice is stored.
  if (!hydrated || consent !== null) return null;

  return (
    <div
      role="region"
      aria-label="Advertising cookie consent"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-void-950/95 p-4 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-300">
          GlowBound uses Google AdSense, which sets cookies to measure and personalise ads. Accepting
          lets advertising load; declining loads no advertising at all and does not affect the game.
          Details are in the{' '}
          <Link
            href="/privacy"
            className="text-electric-300 underline underline-offset-4 hover:text-white"
          >
            privacy policy
          </Link>{' '}
          and{' '}
          <a
            href={GOOGLE_COOKIE_POLICY}
            rel="noopener noreferrer nofollow"
            className="text-electric-300 underline underline-offset-4 hover:text-white"
          >
            Google&apos;s cookie policy
          </a>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAdConsent('denied')}
            aria-label="Decline advertising cookies"
          >
            Decline
          </Button>
          <Button
            type="button"
            onClick={() => setAdConsent('granted')}
            aria-label="Accept advertising cookies"
          >
            Accept
          </Button>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-4xl text-xs text-slate-500">
        Your choice is stored on this device only.{' '}
        <a
          href={GOOGLE_ADS_POLICY}
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-4 hover:text-slate-300"
        >
          How Google uses information from sites or apps
        </a>
      </p>
    </div>
  );
}
