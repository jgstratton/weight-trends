<script lang="ts">
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import { clearAuthCookie, pb } from '$lib/pocketbase';

	let { children, data } = $props();

	async function logout() {
		pb.authStore.clear();
		clearAuthCookie();
		await goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav>
		<span>Signed in as {data.user.email}</span>
		<button type="button" onclick={logout}>Logout</button>
	</nav>
{/if}

{@render children()}
