import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// These actions are stubs — Phase 3 adds OTP email sending and session creation.
export const load: PageServerLoad = async () => {
  return { step: 'email' as 'email' | 'code', email: '' };
};

export const actions: Actions = {
  requestOtp: async () => {
    // TODO (Phase 3): look up / create user, generate code, send email.
    return fail(501, { message: 'OTP email not yet configured.' });
  },

  verifyOtp: async () => {
    // TODO (Phase 3): validate code, create session, set cookie.
    return fail(501, { message: 'OTP verification not yet implemented.' });
  }
};
