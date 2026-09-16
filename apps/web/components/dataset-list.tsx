import type { DatasetMetadata } from "@csv-insight/types";

type DatasetListProps = {
	datasets: DatasetMetadata[];
	selectedDatasetId: string | null;
	onSelect: (datasetId: string) => void;
};

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	if (bytes >= 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${bytes} B`;
}

function formatStatusLabel(): string {
	return "Processed";
}

export function DatasetList({
	datasets,
	selectedDatasetId,
	onSelect,
}: Readonly<DatasetListProps>): JSX.Element {
	return (
		<section
			aria-labelledby="datasets-heading"
			className="p-4 sm:p-6"
		>
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2
						id="datasets-heading"
						className="text-xl font-semibold text-foreground"
					>
						Uploaded datasets
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{datasets.length} dataset{datasets.length === 1 ? "" : "s"}{" "}
						available
					</p>
				</div>
			</div>

			{datasets.length === 0 ? (
				<div className="border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
					No datasets uploaded yet. Use the upload button above to add a CSV.
				</div>
			) : (
				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{datasets.map((dataset) => {
						const isSelected = dataset.id === selectedDatasetId;
						const status = formatStatusLabel();

						return (
							<article
								key={dataset.id}
								className={`border bg-card p-4 transition ${
									isSelected ? "border-primary" : "border-border"
								}`}
							>
								<div className="mb-4 flex items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 items-center justify-center border border-border bg-muted text-sm font-medium text-muted-foreground">
											▣
										</div>
										<div>
											<h3 className="line-clamp-2 text-base font-semibold text-foreground">
												{dataset.originalFileName}
											</h3>
										</div>
									</div>

									<span className="inline-flex border border-primary/35 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
										{status}
									</span>
								</div>

								<div className="mb-5 grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-muted-foreground">
									<div>
										<div className="text-[10px]">Rows</div>
										<div className="mt-1 text-base font-semibold text-foreground">
											{dataset.rowCount}
										</div>
									</div>
									<div>
										<div className="text-[10px]">Cols</div>
										<div className="mt-1 text-base font-semibold text-foreground">
											{dataset.columnCount}
										</div>
									</div>
									<div>
										<div className="text-[10px]">Size</div>
										<div className="mt-1 text-base font-semibold text-foreground">
											{formatBytes(dataset.fileSizeBytes)}
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<span aria-hidden="true">◫</span>
										<time dateTime={dataset.uploadedAt}>
											{new Date(dataset.uploadedAt).toLocaleDateString()}
										</time>
									</div>

									<button
										type="button"
										aria-pressed={isSelected}
										onClick={() => onSelect(dataset.id)}
										className="inline-flex items-center gap-2 font-medium text-primary transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										{isSelected ? "Selected" : "View Data"}{" "}
										<span aria-hidden="true">→</span>
									</button>
								</div>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}
