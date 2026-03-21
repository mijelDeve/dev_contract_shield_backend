export interface TestReport {
  contractId: number;
  passed: number;
  failed: number;
  coverage: number;
  rawOutput: string;
  success: boolean;
  generatedAt: string;
  error?: string;
}

export interface TestExecution {
  status: 'pending' | 'running' | 'completed' | 'failed';
  report?: TestReport;
  startedAt?: string;
}
