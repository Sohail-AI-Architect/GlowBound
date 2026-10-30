import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo/site';

// Uses the default Node.js runtime. Next.js 16 deprecates the Edge runtime for
// this route, and ImageResponse renders without loading external fonts.

export const alt = 'GlowBound — a free neon arcade survival game played in the browser';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #050313 0%, #0c0a24 55%, #1a0630 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#7fd8ff',
          }}
        >
          Neon arcade survival
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 24 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 999,
              background: 'radial-gradient(circle at 40% 35%, #ffffff, #a5f3fc 35%, #38bdf8 70%, #8b5cf6)',
              boxShadow: '0 0 90px rgba(139, 92, 246, 0.85)',
            }}
          />
          <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: 4 }}>{SITE_NAME}</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 36, color: '#cbd5e1' }}>{SITE_TAGLINE}</div>
        <div style={{ marginTop: 12, fontSize: 28, color: '#94a3b8' }}>
          Dodge neon hazards · collect energy gems · chain combos · free in your browser
        </div>
      </div>
    ),
    { ...size },
  );
}
