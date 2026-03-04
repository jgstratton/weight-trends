<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data, form } = $props();

	// Today's date in YYYY-MM-DD local time
	const today = new Date().toLocaleDateString('en-CA');

	// Track which row is being edited (by id), null = none
	let editingId = $state<string | null>(null);

	// Loading states
	let addingEntry = $state(false);
	let updatingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	// History search state — keep in sync with URL on navigation
	let searchValue = $state('');
	let searchTimer: ReturnType<typeof setTimeout>;
	$effect(() => { searchValue = data.search; });

	function buildUrl(overrides: Record<string, string | number>) {
		const u = new URL($page.url);
		for (const [k, v] of Object.entries(overrides)) {
			if (v === '' || v === null || v === undefined) u.searchParams.delete(k);
			else u.searchParams.set(k, String(v));
		}
		return u.pathname + u.search;
	}

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchValue = val;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			goto(buildUrl({ search: val, page: 1 }), { keepFocus: true });
		}, 300);
	}

	function sortHref(col: string) {
		const newDir = data.sortBy === col && data.sortDir === 'desc' ? 'asc' : 'desc';
		return buildUrl({ sort: col, dir: newDir, page: 1 });
	}

	function sortIcon(col: string) {
		if (data.sortBy !== col) return '↕';
		return data.sortDir === 'asc' ? '↑' : '↓';
	}

	function pageHref(p: number) {
		return buildUrl({ page: p });
	}

	function getPageNumbers(current: number, total: number): (number | '…')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '…')[] = [1];
		if (current > 3) pages.push('…');
		for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
		if (current < total - 2) pages.push('…');
		pages.push(total);
		return pages;
	}
</script>

<main>
	<!-- Add entry form -->
	<div class="card">
		<h1>Log weight</h1>
		<form
			method="POST"
			action="?/add"
			use:enhance={() => {
				addingEntry = true;
				return async ({ update }) => {
					await update();
					addingEntry = false;
				};
			}}
		>
			<div class="form-grid">
				<label>
					Weight (kg)
					<input name="value" type="number" step="0.1" min="1" max="700" required />
				</label>
				<label>
					Date
					<input name="date" type="date" value={today} max={today} required />
				</label>
				<label>
					Notes
					<input name="notes" type="text" placeholder="Optional" />
				</label>
				<div style="display:flex; align-items:flex-end;">
					<button type="submit" disabled={addingEntry} style="width:100%">
						{#if addingEntry}<span class="spinner" aria-hidden="true"></span>{/if}
						{addingEntry ? 'Saving…' : 'Add'}
					</button>
				</div>
			</div>
		</form>
		{#if form?.action === 'add' && form?.message}
			<p class="alert alert-error">{form.message}</p>
		{/if}
	</div>

	<!-- Weight history -->
	<div class="card">
		<div class="history-header">
			<h2 style="margin-bottom:0">History</h2>
			<input
				class="search-input"
				type="search"
				placeholder="Search…"
				value={searchValue}
				oninput={onSearchInput}
				aria-label="Search history"
			/>
		</div>
		{#if data.weights.length === 0}
			<p class="empty-state">{data.search ? 'No entries match your search.' : 'No entries yet. Log your first weight above.'}</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th><a href={sortHref('date')} class="sort-link">Date <span class="sort-icon" class:sort-active={data.sortBy === 'date'}>{sortIcon('date')}</span></a></th>
							<th><a href={sortHref('value')} class="sort-link">Weight (kg) <span class="sort-icon" class:sort-active={data.sortBy === 'value'}>{sortIcon('value')}</span></a></th>
							<th><a href={sortHref('notes')} class="sort-link">Notes <span class="sort-icon" class:sort-active={data.sortBy === 'notes'}>{sortIcon('notes')}</span></a></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.weights as row (row.id)}
							{#if editingId === row.id}
								<!-- Inline edit row -->
								<tr>
									<td colspan="4">
										<form
											method="POST"
											action="?/update"
											class="inline-edit-form"
											use:enhance={() => {
												updatingId = row.id;
												return async ({ update }) => {
													await update();
													updatingId = null;
													editingId = null;
												};
											}}
										>
											<input type="hidden" name="id" value={row.id} />
											<input name="date" type="date" value={row.date} max={today} required />
											<input name="value" type="number" step="0.1" min="1" max="700" value={row.value} required />
											<input name="notes" type="text" value={row.notes} placeholder="Notes" />
											<button type="submit" class="btn-sm" disabled={updatingId === row.id}>
												{#if updatingId === row.id}<span class="spinner" aria-hidden="true"></span>{/if}
												{updatingId === row.id ? 'Saving…' : 'Save'}
											</button>
											<button
												type="button"
												class="btn-sm"
												onclick={() => (editingId = null)}
												disabled={updatingId === row.id}
											>
												Cancel
											</button>
										</form>
										{#if form?.action === 'update' && form?.message}
											<p class="alert alert-error">{form.message}</p>
										{/if}
									</td>
								</tr>
							{:else}
								<tr>
									<td>{row.date}</td>
									<td>{row.value}</td>
									<td>{row.notes}</td>
									<td>
										<div class="td-actions">
											<button
												type="button"
												class="btn-sm"
												onclick={() => (editingId = row.id)}
												disabled={!!deletingId}
											>
												Edit
											</button>
											<form
												method="POST"
												action="?/delete"
												use:enhance={() => {
													deletingId = row.id;
													return async ({ update }) => {
														await update({ reset: false });
														deletingId = null;
													};
												}}
												style="display:inline"
											>
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="btn-sm btn-danger"
													disabled={deletingId === row.id}
													onclick={(e) => {
														if (!confirm('Delete this entry?')) e.preventDefault();
													}}
												>
													{#if deletingId === row.id}<span class="spinner" aria-hidden="true"></span>{/if}
													{deletingId === row.id ? '…' : 'Delete'}
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if data.pagination.totalPages > 1 || data.pagination.total > 0}
				<div class="pagination">
					<span class="pagination-info">
						{#if data.pagination.total === 0}
							No entries
						{:else}
							{(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of {data.pagination.total}
						{/if}
					</span>
					{#if data.pagination.totalPages > 1}
						<div class="pagination-controls">
							{#if data.pagination.page > 1}
								<a href={pageHref(1)} class="page-btn" title="First">«</a>
								<a href={pageHref(data.pagination.page - 1)} class="page-btn" title="Previous">‹</a>
							{:else}
								<span class="page-btn page-btn-disabled">«</span>
								<span class="page-btn page-btn-disabled">‹</span>
							{/if}
							{#each getPageNumbers(data.pagination.page, data.pagination.totalPages) as p}
								{#if p === '…'}
									<span class="page-btn page-btn-ellipsis">…</span>
								{:else if p === data.pagination.page}
									<span class="page-btn page-btn-active">{p}</span>
								{:else}
									<a href={pageHref(p)} class="page-btn">{p}</a>
								{/if}
							{/each}
							{#if data.pagination.page < data.pagination.totalPages}
								<a href={pageHref(data.pagination.page + 1)} class="page-btn" title="Next">›</a>
								<a href={pageHref(data.pagination.totalPages)} class="page-btn" title="Last">»</a>
							{:else}
								<span class="page-btn page-btn-disabled">›</span>
								<span class="page-btn page-btn-disabled">»</span>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</main>
