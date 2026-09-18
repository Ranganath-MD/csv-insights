import Link from "next/link";

import { AppPageShell } from "@/components/app-page-shell";
import { DatasetDataView } from "@/components/datasets/dataset-data-view";
import { DatasetQualitySummary } from "@/components/datasets/dataset-quality-summary";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { buildDatasetTableHref, getDatasetTablePageData } from "@/lib/datasets";

type DatasetTablePageProps = {
	params: Promise<{ datasetId: string }>;
	searchParams: Promise<{
		page?: string;
		search?: string;
		sortBy?: string;
		sortDirection?: string;
	}>;
};

export default async function DatasetTablePage({
	params,
	searchParams,
}: Readonly<DatasetTablePageProps>): Promise<React.ReactElement> {
	const { datasetId } = await params;
	const resolvedSearchParams = await searchParams;
	const {
		dataset,
		analysis,
		rows,
		totalRows,
		totalPages,
		columns,
		page,
		search,
		sortBy,
		sortDirection,
	} = await getDatasetTablePageData(datasetId, resolvedSearchParams);

	return (
		<AppPageShell
			title={dataset?.originalFileName ?? "Dataset"}
			actions={
				<>
					<ThemeToggle />
					<Button asChild variant="secondary">
						<Link href="/datasets">Back to datasets</Link>
					</Button>
				</>
			}
			alert={<ErrorBanner message={null} />}
		>
			<div className="flex min-h-screen flex-col">
				<DatasetQualitySummary dataset={dataset} analysis={analysis} />
				<form className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
					<div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
						<input
							name="search"
							defaultValue={search}
							placeholder="Filter rows by value"
							className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground md:max-w-xs"
						/>
						<select
							name="sortBy"
							defaultValue={sortBy}
							className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
						>
							<option value="">No sorting</option>
							{columns.map((column) => (
								<option key={column} value={column}>
									{column}
								</option>
							))}
						</select>
						<select
							name="sortDirection"
							defaultValue={sortDirection}
							className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
						>
							<option value="asc">Ascending</option>
							<option value="desc">Descending</option>
						</select>
						<Button type="submit" variant="secondary">
							Apply
						</Button>
					</div>
				</form>
				<div className="flex-1 overflow-hidden">
					<DatasetDataView dataset={dataset} rows={rows} columns={columns} />
				</div>
				<div className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm">
					<div className="flex items-center justify-between gap-3 p-3 text-sm text-muted-foreground">
						<div>
							Showing {rows.length} of {totalRows} rows
						</div>
						<div className="flex items-center gap-2">
							<Button asChild variant="secondary" disabled={page <= 1}>
								<Link
									href={buildDatasetTableHref(datasetId, {
										page: Math.max(1, page - 1),
										search,
										sortBy,
										sortDirection,
									})}
								>
									Previous
								</Link>
							</Button>
							<span>
								Page {page} of {totalPages}
							</span>
							<Button asChild variant="secondary" disabled={page >= totalPages}>
								<Link
									href={buildDatasetTableHref(datasetId, {
										page: Math.min(totalPages, page + 1),
										search,
										sortBy,
										sortDirection,
									})}
								>
									Next
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AppPageShell>
	);
}
