import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const fallbackUrl = 'http://localhost:8090';

export const handle: Handle = async ({ event, resolve }) => {
  const serverPocketBaseUrl = env.POCKETBASE_URL ?? env.PUBLIC_POCKETBASE_URL ?? fallbackUrl;

  event.locals.pb = new PocketBase(serverPocketBaseUrl);
  event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

  if (event.locals.pb.authStore.isValid) {
    try {
      await event.locals.pb.collection('users').authRefresh();
    } catch {
      event.locals.pb.authStore.clear();
    }
  }

  event.locals.user = event.locals.pb.authStore.record;

  const response = await resolve(event);

  response.headers.append(
    'set-cookie',
    event.locals.pb.authStore.exportToCookie({
      sameSite: 'Lax',
      path: '/',
      httpOnly: false
    })
  );

  return response;
};
