import type { DatasetMetadata } from "@csv-insight/types";
import {
	DynamoDBService,
	hydrateDatasetRecord,
} from "../services/dynamodb.service.js";
import { createS3ObjectKey } from "../services/s3.service.js";

export type StoredDataset = DatasetMetadata & {
	s3ObjectKey: string;
};

export class DatasetRepository {
	private readonly localDatasets = new Map<string, StoredDataset>();

	addLocalDataset(dataset: StoredDataset): void {
		this.localDatasets.set(dataset.id, dataset);
	}

	getLocalDatasetById(datasetId: string): StoredDataset | null {
		return this.localDatasets.get(datasetId) ?? null;
	}

	getLocalDatasets(): StoredDataset[] {
		return Array.from(this.localDatasets.values());
	}

	async getDatasetById(datasetId: string): Promise<StoredDataset | null> {
		try {
			const record = await new DynamoDBService().getDatasetById(datasetId);
			if (record) {
				const hydrated = hydrateDatasetRecord(record);
				if (hydrated) {
					return {
						...hydrated,
						s3ObjectKey: createS3ObjectKey(datasetId, record.filename),
					};
				}
			}
		} catch (error) {
			console.error("DynamoDB dataset lookup failed:", error);
		}

		return this.getLocalDatasetById(datasetId);
	}

	async listDatasets(): Promise<StoredDataset[]> {
		const localDatasets = this.getLocalDatasets();
		try {
			const persistedRecords = await new DynamoDBService().listDatasets();
			const persistedDatasets = persistedRecords
				.map((record) => {
					const hydrated = hydrateDatasetRecord(record);
					if (!hydrated) {
						return null;
					}
					return {
						...hydrated,
						s3ObjectKey: createS3ObjectKey(record.datasetId, record.filename),
					};
				})
				.filter((dataset): dataset is StoredDataset => dataset !== null);

			const merged = new Map<string, StoredDataset>();
			for (const dataset of [...persistedDatasets, ...localDatasets]) {
				if (!merged.has(dataset.id)) {
					merged.set(dataset.id, dataset);
				}
			}
			return Array.from(merged.values()).sort((a, b) =>
				b.uploadedAt.localeCompare(a.uploadedAt),
			);
		} catch (error) {
			console.error("DynamoDB dataset list failed:", error);
			return localDatasets;
		}
	}
}

export const datasetRepository = new DatasetRepository();
