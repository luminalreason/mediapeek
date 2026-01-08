import { createThemeAction } from 'remix-themes';

import { createThemeSessionResolverWithSecret } from '../sessions.server';
import type { Route } from './+types/action.set-theme';

export const action = async (args: Route.ActionArgs) => {
  const { context } = args;
  const resolver = createThemeSessionResolverWithSecret(
    context.cloudflare.env.SESSION_SECRET,
  );
  return createThemeAction(resolver)(args);
};
