import type { DatasetMetadata, DatasetRow } from "@csv-insight/types";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type DatasetDataViewProps = {
	dataset: DatasetMetadata | null;
	rows: DatasetRow[];
	columns: string[];
};

function formatStatus(value: string): string {
	const normalized = value.toLowerCase();
	if (normalized.length === 0) {
		return "Unknown";
	}
	if (normalized.includes("shipped")) {
		return "Shipped";
	}
	if (normalized.includes("processing") || normalized.includes("pending")) {
		return "Processing";
	}
	if (normalized.includes("cancel")) {
		return "Cancelled";
	}
	return value;
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
		<div className="border border-border bg-card">
			<div className="overflow-x-auto">
				<div className="max-h-[calc(100vh-240px)] overflow-y-auto">
					<Table className="relative">
						<TableHeader className="sticky top-0 z-10 bg-muted/85 backdrop-blur-sm">
							<TableRow>
								{columns.map((column) => (
									<TableHead
										key={column}
										className="whitespace-nowrap border-b border-border bg-muted/85 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
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
									const rowKey = `${dataset.id}-${rowIndex}`;

									return (
										<TableRow key={rowKey} className="hover:bg-muted/35">
											{columns.map((columnName) => {
												const value = row[columnName];

												if (columnName.toLowerCase() === "status") {
													const status = formatStatus(String(value ?? ""));

													return (
														<TableCell
															key={columnName}
															className="whitespace-nowrap text-sm text-foreground"
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
														key={columnName}
														className="whitespace-nowrap px-4 py-1 text-sm text-foreground"
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
