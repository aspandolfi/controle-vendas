import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Payment } from '../payment.model';

interface PaymentApiResponse {
  id: string;
  customer_id: string;
  date: string;
  amount: number;
  sale_id?: string;
  created_at: string;
}

interface PaymentListApiResponse {
  payments: PaymentApiResponse[];
}

interface CreatePaymentResponse {
  message: string;
  payment: PaymentApiResponse;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Converte Payment da API para o formato do frontend
   */
  private mapApiToPayment(apiPayment: PaymentApiResponse): Payment {
    return {
      id: parseInt(apiPayment.id, 10),
      customerId: parseInt(apiPayment.customer_id, 10),
      saleId: apiPayment.sale_id ? parseInt(apiPayment.sale_id, 10) : undefined,
      date: apiPayment.date.split('T')[0],  // Converte ISO para YYYY-MM-DD
      amount: apiPayment.amount
    };
  }

  /**
   * Lista todos os pagamentos ou filtrados por cliente
   */
  getPayments(customerId?: number): Observable<Payment[]> {
    let params = new HttpParams();
    if (customerId) {
      params = params.set('customer_id', customerId.toString());
    }

    return this.http.get<PaymentListApiResponse>(this.apiUrl, { params }).pipe(
      map(response => response.payments.map(p => this.mapApiToPayment(p)))
    );
  }

  /**
   * Obtém pagamentos de um cliente específico
   */
  getPaymentsByCustomer(customerId: number): Observable<Payment[]> {
    return this.getPayments(customerId);
  }

  /**
   * Cria um novo pagamento
   */
  addPayment(payment: Omit<Payment, 'id'>): Observable<Payment> {
    const body = {
      customer_id: payment.customerId.toString(),
      date: new Date(payment.date).toISOString(),
      amount: payment.amount,
      sale_id: payment.saleId?.toString()
    };

    return this.http.post<CreatePaymentResponse>(this.apiUrl, body).pipe(
      map(response => this.mapApiToPayment(response.payment))
    );
  }
}
