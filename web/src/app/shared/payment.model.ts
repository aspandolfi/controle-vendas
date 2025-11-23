export interface Payment {
    id: number;
    customerId: number;
    saleId?: number; // Opcional para manter compatibilidade
    date: string;
    amount: number;
}

export interface PaymentByCustomer {
    id: number;
    customerId: number;
    customerName: string;
    saleId?: number;
    date: string;
    amount: number;
}