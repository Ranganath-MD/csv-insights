"use client";

export default function DatasetsError({
	reset,
}: Readonly<{
	error: Error & { digest?: string };
	reset: () => void;
}>): JSX.Element {
	return (
		<section className="p-6">
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
				<h2 className="text-lg font-semibold text-foreground">
					Unable to load datasets
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					There was a problem loading the dataset list. Try again in a moment.
				</p>
				<button
					type="button"
					onClick={() => reset()}
					className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
				>
					Retry
				</button>
			</div>
		</section>
	);
}
