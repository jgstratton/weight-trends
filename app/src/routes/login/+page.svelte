<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, persistAuthToCookie } from '$lib/pocketbase';

	let email = '';
	let code = '';
	let otpId = '';
	let infoMessage = '';
	let errorMessage = '';
	let sendingOtp = false;
	let verifyingOtp = false;

	async function sendMagicLink() {
		errorMessage = '';
		infoMessage = '';
		sendingOtp = true;

		try {
			const response = await pb.collection('users').requestOTP(email);
			otpId = response.otpId;
			infoMessage = 'Code sent. Check your email for the one-time code.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to send one-time code.';
		} finally {
			sendingOtp = false;
		}
	}

	async function verifyCode() {
		errorMessage = '';
		infoMessage = '';
		verifyingOtp = true;

		try {
			await pb.collection('users').authWithOTP(otpId, code);
			persistAuthToCookie();
			await goto('/');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to verify one-time code.';
		} finally {
			verifyingOtp = false;
		}
	}
</script>

<h1>Login</h1>

<form on:submit|preventDefault={sendMagicLink}>
	<label for="email">Email</label>
	<input id="email" type="email" bind:value={email} required />
	<button type="submit" disabled={sendingOtp || !email}>
		{sendingOtp ? 'Sending...' : 'Send Magic Link'}
	</button>
</form>

{#if otpId}
	<form on:submit|preventDefault={verifyCode}>
		<label for="code">One-time code</label>
		<input id="code" type="text" bind:value={code} required />
		<button type="submit" disabled={verifyingOtp || !code}>
			{verifyingOtp ? 'Verifying...' : 'Verify Code'}
		</button>
	</form>
{/if}

{#if infoMessage}
	<p>{infoMessage}</p>
{/if}

{#if errorMessage}
	<p>{errorMessage}</p>
{/if}
