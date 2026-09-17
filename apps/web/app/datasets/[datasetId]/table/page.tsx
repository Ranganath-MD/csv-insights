import type { DatasetMetadata, DatasetRow } from "@csv-insight/types";
import Link from "next/link";

import { AppPageShell } from "@/components/app-page-shell";
import { DatasetDataView } from "@/components/dataset-data-view";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getDataset, getDatasetRows } from "@/lib/api";

type DatasetTablePageProps = {
	params: { datasetId: string };
	searchParams: {
		page?: string;
		search?: string;
		sortBy?: string;
		sortDirection?: string;
	};
};

const PAGE_SIZE = 100;

export default async function DatasetTablePage({
	params,
	searchParams,
}: Readonly<DatasetTablePageProps>): Promise<JSX.Element> {
	const datasetId = params.datasetId;
	const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
	const search = searchParams.search?.trim() ?? "";
	const sortBy = searchParams.sortBy?.trim() ?? "";
	const sortDirection = searchParams.sortDirection === "desc" ? "desc" : "asc";
	let dataset: DatasetMetadata | null = null;
	let rows: DatasetRow[] = [];
	let totalRows = 0;
	let error: string | null = null;

	try {
		const [datasetPayload, rowsPayload] = await Promise.all([
			getDataset(datasetId),
			getDatasetRows(datasetId, {
				page,
				pageSize: PAGE_SIZE,
				search,
				sortBy,
				sortDirection,
			}),
		]);
		dataset = datasetPayload.dataset;
		rows = rowsPayload.rows ?? [];
		totalRows = rowsPayload.totalRows ?? 0;
	} catch (loadError) {
		error =
			loadError instanceof Error
				? loadError.message
				: "Unable to load dataset rows.";
	}

	const columns =
		rows.length > 0
			? Object.keys(rows[0] ?? {})
			: Array.from(
					{ length: dataset?.columnCount ?? 0 },
					(_, index) => `Column ${index + 1}`,
				);
	const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
	function hrefForPage(nextPage: number): string {
		const query = new URLSearchParams({ page: String(nextPage) });
		if (search) query.set("search", search);
		if (sortBy) query.set("sortBy", sortBy);
		if (sortDirection === "desc") query.set("sortDirection", sortDirection);
		return `/datasets/${datasetId}/table?${query}`;
	}

	return (
		<AppPageShell
			title={dataset?.originalFileName ?? "Dataset"}
			actions={
				<>
					<ThemeToggle />
					<Button asChild variant="secondary">
						<Link href="/datasets">Back to datasets</Link>
					</Button>
					<Button asChild>
						<Link href={`/datasets/${datasetId}/charts`}>View charts</Link>
					</Button>
				</>
			}
			alert={<ErrorBanner message={error} />}
		>
			<div className="flex min-h-screen flex-col">
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
								<Link href={hrefForPage(Math.max(1, page - 1))}>Previous</Link>
							</Button>
							<span>
								Page {page} of {totalPages}
							</span>
							<Button asChild variant="secondary" disabled={page >= totalPages}>
								<Link href={hrefForPage(Math.min(totalPages, page + 1))}>
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
