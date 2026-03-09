import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Sale, SaleType } from '../sale.model';

interface SaleApiResponse {
  id: string;
  customer_id: string;
  date: string;
  type: 'AVULSO' | 'PRAZO';
  quantity: number;
  total_value: number;
  remaining_balance: number;
  created_at: string;
}

interface SaleListApiResponse {
  sales: SaleApiResponse[];
}

interface CreateSaleResponse {
  message: string;
  sale: SaleApiResponse;
}

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  /**
   * Converte Sale da API para o formato do frontend
   */
  private mapApiToSale(apiSale: SaleApiResponse): Sale {
    return {
      id: parseInt(apiSale.id, 10),
      customerId: apiSale.customer_id ? parseInt(apiSale.customer_id, 10) : undefined,
      type: apiSale.type as SaleType,
      description: `Quantidade: ${apiSale.quantity}`,  // API não tem description, usando quantity
      date: apiSale.date.split('T')[0],  // Converte ISO para YYYY-MM-DD
      totalAmount: apiSale.total_value,
      remainingBalance: apiSale.remaining_balance
    };
  }

  /**
   * Lista todas as vendas ou filtradas por cliente
   */
  getSales(customerId?: number): Observable<Sale[]> {
    let params = new HttpParams();
    if (customerId) {
      params = params.set('customer_id', customerId.toString());
    }

    return this.http.get<SaleListApiResponse>(this.apiUrl, { params }).pipe(
      map(response => response.sales.map(s => this.mapApiToSale(s)))
    );
  }

  /**
   * Obtém vendas de um cliente específico
   */
  getSalesByCustomer(customerId: number): Observable<Sale[]> {
    return this.getSales(customerId);
  }

  /**
   * Cria uma nova venda
   */
  addSale(sale: Omit<Sale, 'id' | 'remainingBalance'>): Observable<Sale> {
    const body = {
      customer_id: sale.customerId?.toString(),
      date: new Date(sale.date).toISOString(),
      type: sale.type,
      quantity: 1,  // Valor padrão, pode ser ajustado conforme necessário
      total_value: sale.totalAmount
    };

    return this.http.post<CreateSaleResponse>(this.apiUrl, body).pipe(
      map(response => this.mapApiToSale(response.sale))
    );
  }

  /**
   * Calcula o saldo em aberto de um cliente
   */
  getCustomerOpenBalance(customerId: number): Observable<number> {
    return this.getSalesByCustomer(customerId).pipe(
      map(sales => 
        sales
          .filter(s => s.type === 'PRAZO')
          .reduce((sum, s) => sum + s.remainingBalance, 0)
      )
    );
  }
}
