"use client";

import type { DatasetMetadata } from "@csv-insight/types";
import { useCallback, useEffect, useState } from "react";
import { AppPageShell } from "@/components/app-page-shell";
import { DatasetList } from "@/components/dataset-list";
import { DatasetUpload } from "@/components/dataset-upload";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { listDatasets } from "@/lib/api";

export default function DatasetsPage(): JSX.Element {
	const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [processingMessage, setProcessingMessage] = useState<string | null>(
		null,
	);
	const [processingDatasetId, setProcessingDatasetId] = useState<string | null>(
		null,
	);

	const loadDatasets = useCallback(async (): Promise<void> => {
		try {
			const response = await listDatasets();
			const nextDatasets = response.datasets ?? [];
			setDatasets(nextDatasets);
			if (processingDatasetId) {
				const datasetExists = nextDatasets.some(
					(dataset) => dataset.id === processingDatasetId,
				);
				if (datasetExists) {
					setProcessingMessage(null);
					setProcessingDatasetId(null);
				}
			}
			setError(null);
		} catch (loadError) {
			setError(
				loadError instanceof Error
					? loadError.message
					: "Unable to load datasets.",
			);
		}
	}, [processingDatasetId]);

	useEffect(() => {
		void loadDatasets();
	}, [loadDatasets]);

	useEffect(() => {
		if (!processingDatasetId) {
			return undefined;
		}

		let attempts = 0;
		let timeoutId: number | undefined;

		const pollForDataset = async (): Promise<void> => {
			attempts += 1;
			const response = await listDatasets();
			const nextDatasets = response.datasets ?? [];
			setDatasets(nextDatasets);
			const datasetExists = nextDatasets.some(
				(dataset) => dataset.id === processingDatasetId,
			);

			if (datasetExists) {
				setProcessingMessage(null);
				setProcessingDatasetId(null);
				return;
			}

			if (attempts >= 6) {
				setProcessingMessage(
					`Still processing... (id: ${processingDatasetId})`,
				);
				setProcessingDatasetId(null);
				return;
			}

			timeoutId = window.setTimeout(() => {
				void pollForDataset();
			}, 5000);
		};

		void pollForDataset();

		return () => {
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [processingDatasetId]);

	return (
		<AppPageShell
			actions={
				<>
					<ThemeToggle />
					<DatasetUpload
						onProcessingMessageChange={(message) => {
							if (message === null) {
								setProcessingMessage(null);
								setProcessingDatasetId(null);
								return;
							}
							setProcessingMessage(message);
							if (message.includes("(id:")) {
								const datasetId = message.match(/\(id: ([^)]+)\)/)?.[1];
								if (datasetId) {
									setProcessingDatasetId(datasetId);
								}
							}
						}}
					/>
				</>
			}
			alert={
				<>
					{error ? <ErrorBanner message={error} /> : null}
					{processingMessage ? (
						<div
							className="border-b border-emerald-200 bg-emerald-500 px-4 py-3 text-sm font-medium text-white"
							role="status"
							aria-live="polite"
						>
							{processingMessage}
						</div>
					) : null}
				</>
			}
		>
			<DatasetList
				datasets={datasets}
				activeDatasetId={datasets[0]?.id ?? null}
			/>
		</AppPageShell>
	);
}
