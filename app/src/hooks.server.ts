import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/db/index.js';
import { sessions, users } from '$lib/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session_id') ?? null;
  event.locals.user = null;
  event.locals.sessionId = null;

  if (sessionId) {
    const [row] = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        email: users.email
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (row) {
      event.locals.user = { id: row.userId, email: row.email };
      event.locals.sessionId = sessionId;
    }
  }

  return resolve(event);
};
