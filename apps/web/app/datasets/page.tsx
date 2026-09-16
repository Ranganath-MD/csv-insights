"use client";

import type { DatasetMetadata, ListDatasetsResponse } from "@csv-insight/types";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { DatasetList } from "@/components/dataset-list";
import { ThemeToggle } from "@/components/theme-toggle";

const API_BASE_URL = "http://localhost:4000";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function DatasetsPage(): JSX.Element {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
	const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
		null,
	);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function loadDatasets(): Promise<void> {
		try {
			const response = await fetch(`${API_BASE_URL}/datasets`);
			if (!response.ok) {
				throw new Error("Failed to fetch datasets");
			}

			const payload = (await response.json()) as ListDatasetsResponse;
			const nextDatasets = payload.datasets ?? [];
			setDatasets(nextDatasets);

			if (!selectedDatasetId && nextDatasets.length > 0) {
				setSelectedDatasetId(nextDatasets[0]?.id ?? null);
			}
		} catch (loadError) {
			const message =
				loadError instanceof Error
					? loadError.message
					: "Unable to load datasets.";
			setError(message);
		}
	}

	async function handleUpload(
		event: ChangeEvent<HTMLInputElement>,
	): Promise<void> {
		const nextFile = event.target.files?.[0] ?? null;
		if (!nextFile) {
			return;
		}

		if (!nextFile.name.toLowerCase().endsWith(".csv")) {
			setError("Please upload a CSV file.");
			event.target.value = "";
			return;
		}

		if (nextFile.size > MAX_FILE_SIZE_BYTES) {
			setError("CSV files must be 10 MB or smaller.");
			event.target.value = "";
			return;
		}

		try {
			setIsUploading(true);
			setError(null);

			const formData = new FormData();
			formData.append("file", nextFile);

			const response = await fetch(`${API_BASE_URL}/datasets`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const payload = (await response
					.json()
					.catch(() => ({ error: "Upload failed" }))) as {
					error?: string;
				};
				throw new Error(payload.error ?? "Upload failed");
			}

			const payload = (await response.json()) as { dataset: DatasetMetadata };
			setDatasets((current) => [payload.dataset, ...current]);
			setSelectedDatasetId(payload.dataset.id);
			router.push(`/datasets/${payload.dataset.id}/table`);
		} catch (uploadError) {
			const message =
				uploadError instanceof Error ? uploadError.message : "Upload failed";
			setError(message);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}

	useEffect(() => {
		void loadDatasets();
	}, []);

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="w-full">
				<header className="border-b border-border bg-card">
					<div className="max-w-screen-lg mx-auto border-x flex flex-col gap-4  px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
								CSV Insight
							</p>
						</div>

						<div className="flex items-center gap-3">
							<ThemeToggle />
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,text/csv"
								className="sr-only"
								aria-label="Upload a CSV dataset"
								onChange={handleUpload}
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploading}
								className="inline-flex items-center justify-center border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isUploading ? "Uploading..." : "Upload CSV"}
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

				<div className="max-w-screen-lg mx-auto border-x min-h-screen">
					<DatasetList
						datasets={datasets}
						selectedDatasetId={selectedDatasetId}
						onSelect={(datasetId) => {
							setSelectedDatasetId(datasetId);
							router.push(`/datasets/${datasetId}/table`);
						}}
					/>
				</div>
			</div>
		</main>
	);
}
