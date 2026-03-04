<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let showCodeStep = $state(false);
	let email = $state('');
	let sendingCode = $state(false);
	let verifyingCode = $state(false);
</script>

<svelte:head>
	<title>Login – Weight Trends</title>
</svelte:head>

<div class="login-wrapper">
	<div class="login-card">
		<h1>Weight Trends</h1>
		<p class="login-subtitle">
			{showCodeStep ? 'Enter the 6-digit code sent to your email.' : 'Sign in with your email to continue.'}
		</p>

		{#if !showCodeStep}
			<form
				method="POST"
				action="?/requestOtp"
				use:enhance={() => {
					sendingCode = true;
					return async ({ result, update }) => {
						if (result.type === 'failure') {
							await update();
						} else {
							showCodeStep = true;
						}
						sendingCode = false;
					};
				}}
			>
				<div class="field" style="margin-bottom:1rem;">
					<label for="email">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						autocomplete="email"
						required
					/>
				</div>
				<button type="submit" style="width:100%" disabled={sendingCode}>
					{#if sendingCode}<span class="spinner" aria-hidden="true"></span>{/if}
					{sendingCode ? 'Sending code…' : 'Send One-Time Code'}
				</button>
			</form>
		{:else}
			<form
				method="POST"
				action="?/verifyOtp"
				use:enhance={() => {
					verifyingCode = true;
					return async ({ update }) => {
						await update();
						verifyingCode = false;
					};
				}}
			>
				<input type="hidden" name="email" value={email} />
				<div class="field" style="margin-bottom:1rem;">
					<label for="code">One-time code</label>
					<input
						id="code"
						name="code"
						type="text"
						inputmode="numeric"
						placeholder="123456"
						required
						autocomplete="one-time-code"
						autofocus
					/>
				</div>
				<button type="submit" style="width:100%; margin-bottom:0.5rem;" disabled={verifyingCode}>
					{#if verifyingCode}<span class="spinner" aria-hidden="true"></span>{/if}
					{verifyingCode ? 'Verifying…' : 'Verify Code'}
				</button>
				<button
					type="button"
					style="width:100%"
					onclick={() => (showCodeStep = false)}
					disabled={verifyingCode}
				>
					← Back
				</button>
			</form>
		{/if}

		{#if form?.message}
			<p class="alert alert-error">{form.message}</p>
		{/if}
	</div>
</div>
