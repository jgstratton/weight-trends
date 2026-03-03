import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginRoute = url.pathname === '/login';

  if (!locals.user && !isLoginRoute) {
    throw redirect(303, '/login');
  }

  if (locals.user && isLoginRoute) {
    throw redirect(303, '/');
  }

  return {
    user: locals.user
      ? {
          id: locals.user.id,
          email: String(locals.user.email ?? ''),
          name: String(locals.user.name ?? '')
        }
      : null
  };
};
