import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: PocketBase;
			user: RecordModel | null;
		}

		interface PageData {
			user: {
				id: string;
				email: string;
				name: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
