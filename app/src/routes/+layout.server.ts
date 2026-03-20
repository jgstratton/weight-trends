import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/db/index.js';
import { userSettings } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLoginRoute = url.pathname === '/login';

  if (!locals.user && !isLoginRoute) {
    throw redirect(303, '/login');
  }

  if (locals.user && isLoginRoute) {
    throw redirect(303, '/');
  }

  let targetWeight: number | null = null;
  if (locals.user) {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, locals.user.id));
    const settings = rows[0] ?? null;
    targetWeight = settings?.targetWeight ? parseFloat(settings.targetWeight) : null;
  }

  return {
    user: locals.user ? { id: locals.user.id, email: locals.user.email } : null,
    targetWeight
  };
};
