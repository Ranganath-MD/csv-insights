"use client";

import type { DatasetMetadata } from "@csv-insight/types";
import { useRouter } from "next/navigation";
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AppPageShell } from "@/components/app-page-shell";
import { DatasetList } from "@/components/dataset-list";
import { ErrorBanner } from "@/components/error-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { listDatasets, uploadDataset } from "@/lib/api";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function DatasetsPage(): JSX.Element {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
	const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDatasets = useCallback(async (): Promise<void> => {
		try {
			setError(null);
			const payload = await listDatasets();
			const nextDatasets = payload.datasets ?? [];
			setDatasets(nextDatasets);
			setActiveDatasetId((current) => current ?? nextDatasets[0]?.id ?? null);
		} catch (loadError) {
			const message =
				loadError instanceof Error
					? loadError.message
					: "Unable to load datasets.";
			setError(message);
		}
	}, []);

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
			const payload = await uploadDataset(nextFile);
			setDatasets((current) => [payload.dataset, ...current]);
			setActiveDatasetId(payload.dataset.id);
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
	}, [loadDatasets]);

	return (
		<AppPageShell
			actions={
				<>
					<ThemeToggle />
					<input
						ref={fileInputRef}
						type="file"
						name="datasetCsv"
						accept=".csv,text/csv"
						className="sr-only"
						aria-label="Upload a CSV dataset"
						onChange={handleUpload}
					/>
					<Button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
					>
						{isUploading ? "Uploading..." : "Upload CSV"}
					</Button>
				</>
			}
			alert={<ErrorBanner message={error} />}
		>
			<DatasetList datasets={datasets} activeDatasetId={activeDatasetId} />
		</AppPageShell>
	);
}
			<DatasetList datasets={datasets} activeDatasetId={activeDatasetId} />
		</AppPageShell>
	);
}
