<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';

	let { children, data } = $props();
	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>

{#if data.user}
	<nav>
		<div class="nav-inner">
			<div class="nav-left">
				<a href="/" class="nav-brand-link"><img src="/favicon.png" alt="Weight Trends" class="nav-logo" /></a>
				<a href="/trends" class="nav-link" class:nav-link-active={$page.url.pathname === '/trends'}>My Trends</a>
				<a href="/" class="nav-link" class:nav-link-active={$page.url.pathname === '/'}>Chart</a>
				<a href="/log" class="nav-link" class:nav-link-active={$page.url.pathname === '/log'}>Log</a>
			</div>
			<button
				class="nav-toggle"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
				onclick={toggleMenu}
			>
				<span class="nav-toggle-bar"></span>
				<span class="nav-toggle-bar"></span>
				<span class="nav-toggle-bar"></span>
			</button>
		</div>
		{#if menuOpen}
			<div class="nav-expanded">
				<a
					href="/import"
					class="nav-link"
					class:nav-link-active={$page.url.pathname === '/import'}
					onclick={() => (menuOpen = false)}
				>Import CSV</a>
				<span class="nav-email">{data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit">Logout</button>
				</form>
			</div>
		{/if}
	</nav>
{/if}

{@render children()}
