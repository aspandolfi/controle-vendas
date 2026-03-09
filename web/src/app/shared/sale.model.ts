// src/app/shared/models/sale.model.ts
export type SaleType = 'PRAZO' | 'AVULSO';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_CREDITO_PARCELADO' | 'CARTAO_DEBITO';

export interface Sale {
  id: number;
  customerId?: number;     // obrigatório para PRAZO, opcional para AVULSO
  type: SaleType;
  description: string;
  date: string;            // ISO string simples
  totalAmount: number;
  remainingBalance: number;
  paymentMethod?: PaymentMethod; // opcional, usado principalmente em vendas avulsas
}