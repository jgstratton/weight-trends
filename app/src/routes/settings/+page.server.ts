import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/db/index.js';
import { userSettings } from '$lib/db/schema.js';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login');

    const data = await request.formData();
    const raw = String(data.get('targetWeight') ?? '').trim();

    if (raw === '') {
      await db
        .insert(userSettings)
        .values({ userId: locals.user.id, targetWeight: null })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { targetWeight: null, updatedAt: new Date() }
        });
      return { settingsSaved: true };
    }

    const value = parseFloat(raw);
    if (isNaN(value) || value <= 0) {
      return fail(400, { settingsError: 'Please enter a valid target weight.' });
    }

    await db
      .insert(userSettings)
      .values({ userId: locals.user.id, targetWeight: value.toString() })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { targetWeight: value.toString(), updatedAt: new Date() }
      });

    return { settingsSaved: true };
  }
};
