import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Customer } from '../customer.model';

interface CustomerApiResponse {
  id: string;
  name: string;
  created_at: string;
}

interface CustomerListApiResponse {
  customers: CustomerApiResponse[];
}

interface CreateCustomerResponse {
  message: string;
  customer: CustomerApiResponse;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  /**
   * Converte Customer da API para o formato do frontend
   */
  private mapApiToCustomer(apiCustomer: CustomerApiResponse): Customer {
    return {
      id: parseInt(apiCustomer.id, 10),
      name: apiCustomer.name,
      phone: '',  // API não tem phone ainda, será adicionado futuramente
      address: '',  // API não tem address ainda, será adicionado futuramente
      authorizedPeople: []  // API não tem authorizedPeople ainda
    };
  }

  /**
   * Lista todos os clientes
   */
  getCustomers(): Observable<Customer[]> {
    return this.http.get<CustomerListApiResponse>(this.apiUrl).pipe(
      map(response => response.customers.map(c => this.mapApiToCustomer(c)))
    );
  }

  /**
   * Cria um novo cliente
   */
  addCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<CreateCustomerResponse>(this.apiUrl, {
      name: customer.name
    }).pipe(
      map(response => this.mapApiToCustomer(response.customer))
    );
  }

  /**
   * Atualiza um cliente existente
   * TODO: Implementar endpoint PUT na API
   */
  updateCustomer(customer: Customer): Observable<void> {
    console.warn('Update customer not implemented in API yet');
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  /**
   * Obtém um cliente por ID
   * TODO: Implementar endpoint GET /customers/:id na API
   */
  getCustomerById(id: number): Observable<Customer | undefined> {
    console.warn('Get customer by ID not implemented in API yet');
    return new Observable(observer => {
      observer.next(undefined);
      observer.complete();
    });
  }
}
