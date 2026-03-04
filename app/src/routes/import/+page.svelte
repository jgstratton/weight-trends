<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let importing = $state(false);
	let csvFileInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (form && 'imported' in form && csvFileInput) {
			csvFileInput.value = '';
		}
	});
</script>

<main>
	<div class="card">
		<h1>Import from CSV</h1>
		<p style="margin-top:0; color:#666; font-size:0.9rem;">
			Upload a CSV file with two columns: <strong>date</strong> and <strong>weight</strong> (kg).
			Accepted date formats: <code>YYYY-MM-DD</code> or <code>MM/DD/YYYY</code>. A header row is
			optional.
		</p>
		<p style="color:#666; font-size:0.9rem;">Example:</p>
		<pre
			style="background:#f5f7fa; border:1px solid #e0e0e0; border-radius:6px; padding:0.75rem 1rem; font-size:0.85rem; margin-top:0; overflow-x:auto;">date,weight
2026-01-01,85.4
2026-01-02,85.1
2026-01-05,84.8</pre>

		<form
			method="POST"
			action="?/importCsv"
			enctype="multipart/form-data"
			use:enhance={() => {
				importing = true;
				return async ({ update }) => {
					await update();
					importing = false;
				};
			}}
		>
			<div class="form-grid" style="max-width:480px;">
				<label style="grid-column: 1 / -1;">
					CSV file
					<input
						bind:this={csvFileInput}
						name="csv"
						type="file"
						accept=".csv,text/csv"
						required
						style="padding: 0.4rem 0;"
					/>
				</label>
				<div style="display:flex; align-items:flex-end;">
					<button type="submit" disabled={importing} style="width:100%">
						{#if importing}<span class="spinner" aria-hidden="true"></span>{/if}
						{importing ? 'Importing…' : 'Import'}
					</button>
				</div>
			</div>
		</form>

		{#if form}
			{#if form.message}
				<p class="alert alert-error" style="margin-top:1rem;">{form.message}</p>
			{:else if 'imported' in form}
				<p class="alert alert-success" style="margin-top:1rem;">
					Successfully imported {form.imported} row{form.imported === 1 ? '' : 's'}{form.skipped
						? ` (${form.skipped} skipped due to invalid data)`
						: ''}.
				</p>
			{/if}
		{/if}
	</div>
</main>
