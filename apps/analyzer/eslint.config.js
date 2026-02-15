import { config } from '@mediapeek/config-eslint';

export default [
  ...config,
  {
    ignores: ['dist/**', '.wrangler/**', '.turbo/**'],
  },
];
