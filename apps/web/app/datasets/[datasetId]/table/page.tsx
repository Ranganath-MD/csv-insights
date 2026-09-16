"use client";

import type {
	DatasetMetadata,
	DatasetRow,
	DatasetRowsResponse,
} from "@csv-insight/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DatasetDataView } from "@/components/dataset-data-view";
import { ThemeToggle } from "@/components/theme-toggle";

const API_BASE_URL = "http://localhost:4000";

export default function DatasetTablePage(): JSX.Element {
	const router = useRouter();
	const params = useParams<{ datasetId: string }>();
	const datasetId = params.datasetId;

	const [dataset, setDataset] = useState<DatasetMetadata | null>(null);
	const [rows, setRows] = useState<DatasetRow[]>([]);
	const [columns, setColumns] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	async function loadDataset(): Promise<void> {
		try {
			const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}`);
			if (!response.ok) {
				throw new Error("Unable to load dataset");
			}

			const payload = (await response.json()) as { dataset: DatasetMetadata };
			setDataset(payload.dataset);
		} catch (loadError) {
			const message =
				loadError instanceof Error
					? loadError.message
					: "Unable to load dataset.";
			setError(message);
		}
	}

	async function loadRows(): Promise<void> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/datasets/${datasetId}/rows`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch dataset rows");
			}

			const payload = (await response.json()) as DatasetRowsResponse;
			const nextRows = payload.rows ?? [];
			setRows(nextRows);
			setColumns(
				nextRows.length > 0
					? Object.keys(nextRows[0] ?? {})
					: Array.from(
							{ length: dataset?.columnCount ?? 0 },
							(_, index) => `Column ${index + 1}`,
						),
			);
		} catch (loadError) {
			const message =
				loadError instanceof Error
					? loadError.message
					: "Unable to load dataset rows.";
			setError(message);
		}
	}

	useEffect(() => {
		if (!datasetId) {
			return;
		}

		void loadDataset();
		void loadRows();
	}, [datasetId]);

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="w-full">
				<header className="border-b border-border bg-card sm:px-6 lg:px-8">
					<div className="max-w-screen-lg mx-auto border-x flex flex-col gap-4  px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
								CSV Insight
							</p>
							<h1 className="mt-1 text-2xl font-semibold text-foreground">
								{dataset?.originalFileName ?? "Dataset"}
							</h1>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<ThemeToggle />
							<button
								type="button"
								onClick={() => router.push("/datasets")}
								className="border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							>
								← Back to datasets
							</button>
							<button
								type="button"
								onClick={() => router.push(`/datasets/${datasetId}/charts`)}
								className="border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							>
								View charts
							</button>
						</div>
					</div>
				</header>

				{error ? (
					<div
						className="mx-4 mt-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:mx-6 lg:mx-8"
						role="alert"
					>
						{error}
					</div>
				) : null}

				<div className="max-w-screen-lg mx-auto border-x">
					<DatasetDataView dataset={dataset} rows={rows} columns={columns} />
				</div>
			</div>
		</main>
	);
}
