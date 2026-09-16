import type { DatasetAnalysisSummary } from "@csv-insight/types";

export interface CsvAnalyzer {
	analyze(csvText: string): Promise<DatasetAnalysisSummary>;
}

export function createPlaceholderAnalysis(): DatasetAnalysisSummary {
	return {
		dataset: {
			rowCount: 0,
			columnCount: 0,
			fileSizeBytes: 0,
			missingValueCount: 0,
			duplicateRowCount: 0,
		},
		columns: [],
	};
}
