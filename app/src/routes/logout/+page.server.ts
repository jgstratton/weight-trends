import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/db/index.js';
import { sessions } from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
  default: async ({ locals, cookies }) => {
    if (locals.sessionId) {
      await db.delete(sessions).where(eq(sessions.id, locals.sessionId));
    }

    cookies.delete('session_id', { path: '/' });

    throw redirect(303, '/login');
  }
};
