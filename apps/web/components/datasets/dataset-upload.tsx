"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadDataset } from "@/lib/api";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function DatasetUpload(): React.ReactElement {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleUpload(
		event: ChangeEvent<HTMLInputElement>,
	): Promise<void> {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv")) {
			setError("Please upload a CSV file.");
			event.target.value = "";
			return;
		}
		if (file.size > MAX_FILE_SIZE_BYTES) {
			setError("CSV files must be 10 MB or smaller.");
			event.target.value = "";
			return;
		}
		try {
			setIsUploading(true);
			setError(null);
			await uploadDataset(file);
			router.refresh();
		} catch (uploadError) {
			setError(
				uploadError instanceof Error ? uploadError.message : "Upload failed",
			);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	return (
		<div className="flex items-center gap-2">
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
			{error ? <span className="text-sm text-destructive">{error}</span> : null}
		</div>
	);
}
