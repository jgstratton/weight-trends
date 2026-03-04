<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav>
		<div class="nav-inner">
			<div class="nav-left">
				<span class="nav-brand">Weight Trends</span>
				<a href="/" class="nav-link" class:nav-link-active={$page.url.pathname === '/'}>Chart</a>
				<a href="/log" class="nav-link" class:nav-link-active={$page.url.pathname === '/log'}>Log</a>
				<a href="/import" class="nav-link" class:nav-link-active={$page.url.pathname === '/import'}>Import CSV</a>
			</div>
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
