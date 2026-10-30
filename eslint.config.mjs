import next from 'eslint-config-next';

/**
 * ESLint 9 flat config. Next.js 16 removed `next lint`, so linting runs through
 * the ESLint CLI (`npm run lint`).
 */
const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**'],
  },
  ...next,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default config;
