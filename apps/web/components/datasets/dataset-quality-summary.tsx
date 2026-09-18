import type {
	DatasetAnalysisSummary,
	DatasetMetadata,
} from "@csv-insight/types";

type DatasetQualitySummaryProps = {
	dataset: DatasetMetadata | null;
	analysis: DatasetAnalysisSummary | null;
};

function formatPercentage(value: number): string {
	return `${value.toFixed(1)}%`;
}

export function DatasetQualitySummary({
	dataset,
	analysis,
}: Readonly<DatasetQualitySummaryProps>): JSX.Element | null {
	if (!dataset || !analysis) {
		return null;
	}

	const summary = analysis.dataset;
	const totalCells = summary.rowCount * summary.columnCount;
	const completeness =
		totalCells > 0
			? ((totalCells - summary.missingValueCount) / totalCells) * 100
			: 100;
	const topMissingColumn = [...analysis.columns].sort(
		(left, right) => right.missingValues - left.missingValues,
	)[0];
	const detectedTypes = analysis.columns.reduce(
		(accumulator, column) => {
			accumulator[column.detectedType] =
				(accumulator[column.detectedType] ?? 0) + 1;
			return accumulator;
		},
		{
			string: 0,
			number: 0,
			boolean: 0,
			date: 0,
			unknown: 0,
		},
	);

	return (
		<section className="border-b border-border bg-card px-4 py-5 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
							Data quality
						</p>
						<h2 className="mt-1 text-lg font-semibold text-foreground">
							At a glance
						</h2>
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
							A quick summary of completeness and structure before you inspect
							the table.
						</p>
					</div>
					<div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
						{dataset.originalFileName}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div className="border border-border bg-background p-4">
						<p className="text-sm text-muted-foreground">Completeness</p>
						<p className="mt-2 text-2xl font-semibold text-foreground">
							{formatPercentage(completeness)}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Based on {summary.rowCount * summary.columnCount} cells
						</p>
					</div>

					<div className="border border-border bg-background p-4">
						<p className="text-sm text-muted-foreground">Missing values</p>
						<p className="mt-2 text-2xl font-semibold text-foreground">
							{summary.missingValueCount.toLocaleString()}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Across {summary.columnCount} columns
						</p>
					</div>

					<div className="border border-border bg-background p-4">
						<p className="text-sm text-muted-foreground">Duplicate rows</p>
						<p className="mt-2 text-2xl font-semibold text-foreground">
							{summary.duplicateRowCount.toLocaleString()}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Potential repeats in the upload
						</p>
					</div>

					<div className="border border-border bg-background p-4">
						<p className="text-sm text-muted-foreground">Most missing column</p>
						<p className="mt-2 line-clamp-1 text-2xl font-semibold text-foreground">
							{topMissingColumn
								? topMissingColumn.columnName
								: "No missing data"}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{topMissingColumn
								? `${topMissingColumn.missingValues.toLocaleString()} missing values`
								: "All columns are complete"}
						</p>
					</div>
				</div>

				<div className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-5">
					{Object.entries(detectedTypes).map(([type, count]) => (
						<div key={type}>
							<p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								{type}
							</p>
							<p className="mt-1 text-lg font-semibold text-foreground">
								{count}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
