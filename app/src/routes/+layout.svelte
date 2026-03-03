<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav>
		<span>Signed in as {data.user.email}</span>
		<form method="POST" action="/logout">
			<button type="submit">Logout</button>
		</form>
	</nav>
{/if}

{@render children()}
