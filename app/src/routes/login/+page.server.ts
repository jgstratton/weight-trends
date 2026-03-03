import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createOtpForEmail, verifyOtp, createSession } from '$lib/server/auth.js';
import { sendOtpEmail } from '$lib/server/email.js';

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  requestOtp: async ({ request }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return fail(400, { message: 'Please enter a valid email address.', email });
    }

    try {
      const code = await createOtpForEmail(email);
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error('OTP send error:', err);
      return fail(500, { message: 'Failed to send login code. Please try again.', email });
    }

    // Signal to the client to advance to the code step.
    // We return the email so the hidden field in the next form is pre-populated.
    return { sent: true, email };
  },

  verifyOtp: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const code = String(data.get('code') ?? '').trim();

    if (!email || !code) {
      return fail(400, { message: 'Email and code are required.', email });
    }

    const result = await verifyOtp(email, code);

    if (!result) {
      return fail(400, { message: 'Invalid or expired code. Please try again.', email });
    }

    const sessionId = await createSession(result.userId);

    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    redirect(303, '/');
  }
};
