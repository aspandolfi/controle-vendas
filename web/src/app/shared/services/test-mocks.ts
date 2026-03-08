import { of } from 'rxjs';
import { Customer } from '../customer.model';
import { Sale } from '../sale.model';
import { Payment } from '../payment.model';

export class MockCustomerService {
  private mockCustomers: Customer[] = [
    {
      id: 1,
      name: 'Cliente Teste 1',
      phone: '(11) 98765-4321',
      address: 'Rua Teste, 123',
      authorizedPeople: []
    },
    {
      id: 2,
      name: 'Cliente Teste 2',
      phone: '(11) 97654-3210',
      address: 'Av. Teste, 456',
      authorizedPeople: []
    }
  ];

  getCustomers() {
    return of([...this.mockCustomers]);
  }

  addCustomer(customer: Omit<Customer, 'id'>) {
    const newCustomer: Customer = {
      ...customer,
      id: this.mockCustomers.length + 1
    };
    this.mockCustomers.push(newCustomer);
    return of(newCustomer);
  }

  updateCustomer(customer: Customer) {
    return of(undefined);
  }

  getCustomerById(id: number) {
    return of(this.mockCustomers.find(c => c.id === id));
  }
}

export class MockSaleService {
  private mockSales: Sale[] = [
    {
      id: 1,
      customerId: 1,
      type: 'PRAZO',
      description: 'Venda a prazo 1',
      date: '2026-03-01',
      totalAmount: 100,
      remainingBalance: 50
    },
    {
      id: 2,
      type: 'AVULSO',
      description: 'Venda à vista 1',
      date: '2026-03-02',
      totalAmount: 200,
      remainingBalance: 0,
      paymentMethod: 'DINHEIRO'
    }
  ];

  getSales(customerId?: number) {
    if (customerId) {
      return of(this.mockSales.filter(s => s.customerId === customerId));
    }
    return of([...this.mockSales]);
  }

  getSalesByCustomer(customerId: number) {
    return this.getSales(customerId);
  }

  addSale(sale: Omit<Sale, 'id' | 'remainingBalance'>) {
    const newSale: Sale = {
      ...sale,
      id: this.mockSales.length + 1,
      remainingBalance: sale.type === 'AVULSO' ? 0 : sale.totalAmount
    };
    this.mockSales.push(newSale);
    return of(newSale);
  }

  getCustomerOpenBalance(customerId: number) {
    const balance = this.mockSales
      .filter(s => s.customerId === customerId && s.type === 'PRAZO')
      .reduce((sum, s) => sum + s.remainingBalance, 0);
    return of(balance);
  }
}

export class MockPaymentService {
  private mockPayments: Payment[] = [
    {
      id: 1,
      customerId: 1,
      saleId: 1,
      date: '2026-03-05',
      amount: 50
    }
  ];

  getPayments(customerId?: number) {
    if (customerId) {
      return of(this.mockPayments.filter(p => p.customerId === customerId));
    }
    return of([...this.mockPayments]);
  }

  getPaymentsByCustomer(customerId: number) {
    return this.getPayments(customerId);
  }

  addPayment(payment: Omit<Payment, 'id'>) {
    const newPayment: Payment = {
      ...payment,
      id: this.mockPayments.length + 1
    };
    this.mockPayments.push(newPayment);
    return of(newPayment);
  }
}
