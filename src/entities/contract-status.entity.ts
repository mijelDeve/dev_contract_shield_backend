export interface ContractSystemStatus {
  id: number;
  code: string;
  name_es: string;
  name_en: string;
  description?: string;
}

export interface GenlayerTransactionStatus {
  id: number;
  code: string;
  name: string;
  description?: string;
  phase?: string;
}
