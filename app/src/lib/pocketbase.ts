import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';
import { writable } from 'svelte/store';
import type { RecordModel } from 'pocketbase';

const fallbackUrl = 'http://localhost:8090';
const pocketBaseUrl = env.PUBLIC_POCKETBASE_URL || fallbackUrl;

export const pb = new PocketBase(pocketBaseUrl);
export const authUser = writable<RecordModel | null>(pb.authStore.record);

if (typeof window !== 'undefined') {
  pb.authStore.onChange(() => {
    authUser.set(pb.authStore.record);
  }, true);
}

export function persistAuthToCookie() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = pb.authStore.exportToCookie({
    sameSite: 'Lax',
    path: '/'
  });
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = pb.authStore.exportToCookie({
    sameSite: 'Lax',
    path: '/',
    expires: new Date(0)
  });
}
