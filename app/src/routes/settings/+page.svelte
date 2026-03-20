<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();

	const targetWeight = $derived.by(() => {
		const value = ($page.data as Record<string, unknown>).targetWeight;
		if (typeof value === 'number') return value.toString();
		return '';
	});
</script>

<main class="settings-page">
	<h1>Settings</h1>

	<section class="settings-section">
		<h2>Goals</h2>
		<form method="POST" use:enhance>
			<div class="field">
				<label for="target-weight">Target Weight (lbs)</label>
				<p class="hint">Trend lines stop projecting when they reach this weight.</p>
				<div class="field-row">
					<input
						id="target-weight"
						name="targetWeight"
						type="number"
						step="0.1"
						min="1"
						max="9999"
						placeholder="e.g. 175"
						value={targetWeight}
					/>
					<span class="unit">lbs</span>
					<button type="submit">Save</button>
				</div>
				{#if form?.settingsSaved}
					<p class="success">Settings saved.</p>
				{/if}
				{#if form?.settingsError}
					<p class="error">{form.settingsError}</p>
				{/if}
			</div>
		</form>
	</section>
</main>

<style>
	.settings-page {
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #f1f5f9;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 2rem;
	}

	.settings-section {
		background: #1e293b;
		border-radius: 10px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #94a3b8;
		margin: 0 0 1.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.hint {
		font-size: 0.8rem;
		color: #64748b;
		margin: 0 0 0.5rem;
	}

	.field-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	input[type='number'] {
		width: 120px;
		padding: 0.4rem 0.6rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 6px;
		color: #f1f5f9;
		font-size: 0.95rem;
	}

	.unit {
		color: #64748b;
		font-size: 0.85rem;
	}

	button[type='submit'] {
		padding: 0.4rem 1rem;
		background: #6366f1;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	button[type='submit']:hover {
		background: #4f46e5;
	}

	.success {
		color: #4ade80;
		font-size: 0.85rem;
		margin: 0.5rem 0 0;
	}

	.error {
		color: #f87171;
		font-size: 0.85rem;
		margin: 0.5rem 0 0;
	}
</style>
