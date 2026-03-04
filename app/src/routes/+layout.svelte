<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav>
		<div class="nav-inner">
			<span class="nav-brand">Weight Trends</span>
			<div class="nav-user">
				<span class="nav-email">{data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit">Logout</button>
				</form>
			</div>
		</div>
	</nav>
{/if}

{@render children()}
