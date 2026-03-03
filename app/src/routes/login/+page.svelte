<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let showCodeStep = $state(false);
	let email = $state('');
</script>

<h1>Login</h1>

{#if !showCodeStep}
	<form
		method="POST"
		action="?/requestOtp"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'failure') {
					await update();
				} else {
					showCodeStep = true;
				}
			};
		}}
	>
		<label for="email">Email</label>
		<input id="email" name="email" type="email" bind:value={email} required />
		<button type="submit">Send One-Time Code</button>
	</form>
{:else}
	<form method="POST" action="?/verifyOtp" use:enhance>
		<input type="hidden" name="email" value={email} />
		<label for="code">One-time code</label>
		<input id="code" name="code" type="text" inputmode="numeric" required autocomplete="one-time-code" />
		<button type="submit">Verify Code</button>
		<button type="button" onclick={() => (showCodeStep = false)}>Back</button>
	</form>
{/if}

{#if form?.message}
	<p>{form.message}</p>
{/if}
