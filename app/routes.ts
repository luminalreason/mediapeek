import { index, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  { file: 'routes/home.tsx', path: 'home' },
] satisfies RouteConfig;
