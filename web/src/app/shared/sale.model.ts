// src/app/shared/models/sale.model.ts
export type SaleType = 'PRAZO' | 'AVULSO';

export interface Sale {
  id: number;
  customerId?: number;     // obrigatório para PRAZO, opcional para AVULSO
  type: SaleType;
  description: string;
  date: string;            // ISO string simples
  totalAmount: number;
  remainingBalance: number;
}