'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdConsent } from './CookieConsent';

/** AdSense publisher (account) id used by every slot on this site. */
export const ADSENSE_CLIENT = 'ca-pub-1050989368957924';

const ADSENSE_SCRIPT_ID = 'adsense-script';
const ADSENSE_SCRIPT_HOST = 'https://pagead2.googlesyndication.com';

/**
 * Ad unit slot ids from AdSense -> Ads -> By ad unit.
 *
 * Replace these two values with the slot ids of the ad units you create for
 * this site. Until real ids are configured AdSense reports "unfilled" and each
 * banner collapses itself, so no empty boxes are ever left on the page.
 */
export const AD_SLOTS = {
  /** Leaderboard directly under the game arena. */
  game: '0000000001',
  /** In-content banner at the end of the text pages. */
  content: '0000000002',
} as const;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Injects the AdSense loader script exactly once, and only after the visitor
 * has accepted advertising cookies. Renders nothing itself.
 */
export function AdSenseScript() {
  const consent = useAdConsent();

  useEffect(() => {
    if (consent !== 'granted') return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(ADSENSE_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `${ADSENSE_SCRIPT_HOST}/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(script);
  }, [consent]);

  return null;
}

interface AdBannerProps {
  /** Ad unit slot id (see AD_SLOTS). */
  slot: string;
  /** Extra classes, used for spacing around the banner (e.g. "mt-12"). */
  className?: string;
  /**
   * Override the reserved placeholder height in px. The default reserves a
   * small mobile banner growing to a desktop rectangle, which keeps layout
   * stable while the ad loads (no cumulative layout shift).
   */
  minHeight?: number;
  /** Accessible label shown above the unit while it loads. */
  label?: string;
}

/**
 * Responsive AdSense unit.
 *
 * - Reserves its box before the ad arrives, so nothing below it jumps (CLS).
 * - Renders nothing at all until advertising cookies are accepted.
 * - Watches the unit's fill status and collapses completely when AdSense
 *   returns no ad (blocked, unfilled or timed out), so an empty slot never
 *   leaves a blank rectangle on the page.
 */
export function AdBanner({
  slot,
  className = '',
  minHeight,
  label = 'Advertisement',
}: AdBannerProps) {
  const consent = useAdConsent();
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  const visible = consent === 'granted' && !collapsed;

  // Ask AdSense to fill the slot once the <ins> element is in the DOM.
  useEffect(() => {
    if (!visible || pushedRef.current) return;
    if (!insRef.current) return;
    pushedRef.current = true;

    try {
      const queue = window.adsbygoogle ?? [];
      queue.push({
        google_ad_client: ADSENSE_CLIENT,
        google_ad_slot: slot,
        google_ad_format: 'auto',
        full_width_responsive: true,
      });
      window.adsbygoogle = queue;
    } catch {
      // Never setState synchronously inside an effect: collapse on the next
      // tick instead. The observer's timeout also covers this path.
      window.setTimeout(() => setCollapsed(true), 0);
    }
  }, [visible, slot]);

  // Watch for a fill result; collapse the banner if no ad arrives.
  useEffect(() => {
    if (!visible) return;
    const ins = insRef.current;
    if (!ins) return;

    const status = () => ins.getAttribute('data-ad-status');

    let observer: MutationObserver | null = null;
    let timer: number | undefined;

    const stop = () => {
      observer?.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
    const collapse = () => {
      stop();
      setCollapsed(true);
    };

    observer = new MutationObserver(() => {
      const value = status();
      if (value === 'filled') stop();
      else if (value === 'unfilled' || value === 'error') collapse();
    });
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Safety net: if nothing resolves in time (script blocked, offline, no
    // consent handshake), remove the reserved box instead of showing a gap.
    timer = window.setTimeout(() => {
      if (status() !== 'filled') collapse();
      else stop();
    }, 8000);

    return stop;
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label={label}
      className={`mx-auto w-full max-w-3xl ${minHeight ? '' : 'min-h-[100px] sm:min-h-[250px]'} ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <span className="mb-1 block text-center text-[0.65rem] font-medium uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <ins
        ref={insRef}
        className="block w-full"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
