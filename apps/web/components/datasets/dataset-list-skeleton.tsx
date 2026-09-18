export function DatasetListSkeleton(): React.ReactElement {
	return (
		<section className="p-4 sm:p-6" aria-busy="true" aria-live="polite">
			<div className="mb-5 flex items-center justify-between">
				<div className="h-6 w-40 animate-pulse rounded bg-muted" />
				<div className="h-6 w-24 animate-pulse rounded bg-muted" />
			</div>
			<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={index}
						className="h-60 animate-pulse rounded-lg border border-border bg-muted/40"
					/>
				))}
			</div>
		</section>
	);
}
