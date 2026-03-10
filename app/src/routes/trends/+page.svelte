<script lang="ts">
	let { data } = $props();

	/**
	 * Format a number to 1 decimal place.
	 */
	function fmt(n: number, decimals = 1): string {
		return n.toFixed(decimals);
	}

	/**
	 * Format lbs/week with sign and color indicator.
	 */
	function rateClass(lbsPerWeek: number): string {
		if (lbsPerWeek < -0.05) return 'trend-losing';
		if (lbsPerWeek > 0.05) return 'trend-gaining';
		return 'trend-stable';
	}

	function rateLabel(lbsPerWeek: number): string {
		if (lbsPerWeek < -0.05) return 'Losing';
		if (lbsPerWeek > 0.05) return 'Gaining';
		return 'Stable';
	}

	function signedFmt(n: number, decimals = 1): string {
		const sign = n >= 0 ? '+' : '';
		return sign + n.toFixed(decimals);
	}

	function confidenceLabel(r2: number): string {
		if (r2 >= 0.7) return 'Strong';
		if (r2 >= 0.4) return 'Moderate';
		return 'Weak';
	}

	function confidenceClass(r2: number): string {
		if (r2 >= 0.7) return 'confidence-strong';
		if (r2 >= 0.4) return 'confidence-moderate';
		return 'confidence-weak';
	}

	// The trend currently selected for the projection detail table
	let selectedTrendIdx = $state(0);
	const selectedTrend = $derived(data.trends[selectedTrendIdx]);
</script>

<main>
	<!-- Header -->
	<div class="card trends-header">
		<h1>My Trends</h1>
		{#if data.latestWeight !== null}
			<div class="header-stats">
				<div class="stat">
					<span class="stat-label">Current Weight</span>
					<span class="stat-value">{fmt(data.latestWeight)} lbs</span>
				</div>
				<div class="stat">
					<span class="stat-label">Total Entries</span>
					<span class="stat-value">{data.totalEntries}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Trend Summary Cards -->
	<div class="trend-cards">
		{#each data.trends as t, i}
			<button
				class="card trend-card"
				class:trend-card-active={selectedTrendIdx === i}
				onclick={() => (selectedTrendIdx = i)}
				type="button"
			>
				<div class="trend-card-label">{t.label} Trend</div>
				{#if t.trend}
					<div class="trend-card-rate {rateClass(t.trend.slopePerWeek)}">
						{signedFmt(t.trend.slopePerWeek)} lbs/wk
					</div>
					<div class="trend-card-status {rateClass(t.trend.slopePerWeek)}">
						{rateLabel(t.trend.slopePerWeek)}
					</div>
					<div class="trend-card-meta">
						<span class="trend-card-fit {confidenceClass(t.trend.rSquared)}"
							>{confidenceLabel(t.trend.rSquared)} fit</span
						>
						<span class="trend-card-pts">{t.trend.dataPoints} pts</span>
					</div>
				{:else}
					<div class="trend-card-nodata">Not enough data</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if selectedTrend?.trend}
		<!-- Projections Table -->
		<div class="card">
			<h2>Projections from {selectedTrend.label} Trend</h2>
			<p class="projections-subtitle">
				Based on the current rate of <strong class={rateClass(selectedTrend.trend.slopePerWeek)}
					>{signedFmt(selectedTrend.trend.slopePerWeek, 2)} lbs/week</strong
				>, here is where you are headed:
			</p>

			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Horizon</th>
							<th>Date</th>
							<th>Projected Weight</th>
							<th>Change</th>
						</tr>
					</thead>
					<tbody>
						{#each selectedTrend.projections as p}
							<tr>
								<td class="td-horizon">{p.label}</td>
								<td>{p.projection.date}</td>
								<td class="td-weight">{fmt(p.projection.weight)} lbs</td>
								<td class="td-change {rateClass(p.projection.change)}"
									>{signedFmt(p.projection.change)} lbs</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Trend Details -->
		<div class="card trend-detail">
			<h2>{selectedTrend.label} Trend Details</h2>
			<div class="detail-grid">
				<div class="detail-item">
					<span class="detail-label">Period</span>
					<span class="detail-value">{selectedTrend.trend.startDate} &mdash; {selectedTrend.trend.endDate}</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">Rate</span>
					<span class="detail-value {rateClass(selectedTrend.trend.slopePerWeek)}"
						>{signedFmt(selectedTrend.trend.slopePerWeek, 2)} lbs/week</span
					>
				</div>
				<div class="detail-item">
					<span class="detail-label">Fitted Weight</span>
					<span class="detail-value">{fmt(selectedTrend.trend.currentFitted)} lbs</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">Fit Quality (R²)</span>
					<span class="detail-value {confidenceClass(selectedTrend.trend.rSquared)}"
						>{fmt(selectedTrend.trend.rSquared, 3)} &mdash; {confidenceLabel(
							selectedTrend.trend.rSquared
						)}</span
					>
				</div>
			</div>
		</div>
	{:else if data.totalEntries < 2}
		<div class="card">
			<p class="alert alert-info">
				Log at least 2 weight entries to start seeing trends. Head to the
				<a href="/log">Log</a> page to add entries.
			</p>
		</div>
	{:else}
		<div class="card">
			<p class="alert alert-info">
				Not enough data in the {selectedTrend?.label ?? ''} window. Try selecting a shorter time horizon or log more entries.
			</p>
		</div>
	{/if}
</main>

<style>
	/* ---- Header ---- */
	.trends-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.trends-header h1 {
		margin: 0;
	}
	.header-stats {
		display: flex;
		gap: 1.5rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.stat-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
	}
	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #f1f5f9;
	}

	/* ---- Trend cards row ---- */
	.trend-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.trend-card {
		display: block;
		cursor: pointer;
		text-align: center;
		padding: 1rem 0.75rem;
		border: 2px solid transparent;
		transition: border-color 0.15s, transform 0.1s;
		background: #1e293b;
		width: 100%;
		white-space: normal;
		overflow: visible;
	}
	.trend-card:hover {
		border-color: #334155;
		transform: translateY(-1px);
		background: #1e293b;
	}
	.trend-card-active {
		border-color: #818cf8 !important;
	}
	.trend-card-label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #94a3b8;
		margin-bottom: 0.4rem;
	}
	.trend-card-rate {
		font-size: 1.15rem;
		font-weight: 700;
		line-height: 1.3;
	}
	.trend-card-status {
		font-size: 0.8rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	.trend-card-meta {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		font-size: 0.65rem;
		color: #64748b;
	}
	.trend-card-fit {
		font-weight: 600;
	}
	.trend-card-nodata {
		color: #475569;
		font-size: 0.85rem;
		font-style: italic;
		margin-top: 0.3rem;
	}

	/* ---- Status colors ---- */
	.trend-losing {
		color: #34d399;
	}
	.trend-gaining {
		color: #f87171;
	}
	.trend-stable {
		color: #fbbf24;
	}

	/* ---- Confidence colors ---- */
	.confidence-strong {
		color: #34d399;
	}
	.confidence-moderate {
		color: #fbbf24;
	}
	.confidence-weak {
		color: #f87171;
	}

	/* ---- Detail grid ---- */
	.trend-detail h2 {
		margin-bottom: 0.75rem;
	}
	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
	}
	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.detail-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #94a3b8;
	}
	.detail-value {
		font-size: 1rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	/* ---- Projections ---- */
	.projections-subtitle {
		font-size: 0.9rem;
		color: #94a3b8;
		margin: 0 0 1rem;
	}
	.td-horizon {
		font-weight: 600;
		white-space: nowrap;
	}
	.td-weight {
		font-weight: 600;
	}
	.td-change {
		font-weight: 600;
	}


</style>
