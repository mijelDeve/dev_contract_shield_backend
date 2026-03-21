import {
  ContractSystemStatus,
  GenlayerTransactionStatus,
} from './contract-status.entity';

export interface Contract {
  id: number;
  title: string;
  description?: string;
  amount: number;
  start_date: string;
  due_date: string;
  zip_file_path?: string;
  github_repo_url?: string;
  is_github_project: boolean;
  system_status_id: number;
  genlayer_status_id?: number;
  creator_id: number;
  developer_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ContractWithRelations extends Contract {
  contract_system_statuses?: ContractSystemStatus;
  genlayer_transaction_statuses?: GenlayerTransactionStatus;
  creator?: { id: number; username: string };
  developer?: { id: number; username: string } | null;
}

export interface ContractResponse {
  id: number;
  title: string;
  description?: string;
  amount: number;
  startDate: string;
  dueDate: string;
  zipFilePath?: string;
  githubRepoUrl?: string;
  isGithubProject: boolean;
  systemStatus: {
    id: number;
    code: string;
    nameEs: string;
    nameEn?: string;
  };
  genlayerStatus?: {
    id: number;
    code: string;
    name: string;
    phase?: string;
  } | null;
  creator: {
    id: number;
    username: string;
  };
  developer?: {
    id: number;
    username: string;
  } | null;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedContractsResponse {
  data: ContractResponse[];
  pagination: PaginationInfo;
}
