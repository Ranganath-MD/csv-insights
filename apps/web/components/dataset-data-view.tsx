import type { DatasetMetadata, DatasetRow } from "@csv-insight/types";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

type DatasetDataViewProps = {
	dataset: DatasetMetadata | null;
	rows: DatasetRow[];
	columns: string[];
};

function formatStatus(value: string): string {
	const normalized = value.toLowerCase();
	if (normalized.includes("shipped")) {
		return "Shipped";
	}
	if (normalized.includes("processing") || normalized.includes("pending")) {
		return "Processing";
	}
	if (normalized.includes("cancel")) {
		return "Cancelled";
	}
	return "Shipped";
}

function statusClasses(status: string): string {
	switch (status) {
		case "Processing":
			return "bg-amber-100 text-amber-700 border border-amber-200";
		case "Cancelled":
			return "bg-red-100 text-red-700 border border-red-200";
		default:
			return "bg-emerald-100 text-emerald-700 border border-emerald-200";
	}
}

export function DatasetDataView({
	dataset,
	rows,
	columns,
}: Readonly<DatasetDataViewProps>): JSX.Element {
	if (!dataset) {
		return (
			<div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">
				Select a dataset to inspect the rows.
			</div>
		);
	}

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex w-full max-w-xl items-center gap-3 border border-border bg-card px-4 py-3">
					<span className="text-muted-foreground">⌕</span>
					<input
						className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
						placeholder="Filter product, region..."
						aria-label="Filter dataset"
					/>
				</div>

				<Button className="bg-red-500 h-12">
					Delete
				</Button>
			</div>

			<div className="p-0 border-t">
				<div className="overflow-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/40">
								{columns.map((column) => (
									<TableHead
										key={column}
										className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
									>
										{column}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>

						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={columns.length || 1}
										className="py-8 text-center text-sm text-muted-foreground"
									>
										No rows available.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row, rowIndex) => {
									const status = ["status", "Status"].some(
										(key) => key.toLowerCase() in row,
									)
										? formatStatus(String(row.status ?? "Shipped"))
										: "Shipped";

									return (
										<TableRow
											key={`${dataset.id}-${rowIndex}`}
											className="hover:bg-muted/35"
										>
											{columns.map((columnName) => {
												const value = row[columnName];

												if (columnName.toLowerCase() === "status") {
													return (
														<TableCell
															key={`${columnName}-${rowIndex}`}
															className="text-sm text-foreground"
														>
															<span
																className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClasses(status)}`}
															>
																{status}
															</span>
														</TableCell>
													);
												}

												return (
													<TableCell
														key={`${columnName}-${rowIndex}`}
														className="px-4 py-1 text-sm text-foreground"
													>
														{value === null || value === undefined
															? ""
															: String(value)}
													</TableCell>
												);
											})}
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
