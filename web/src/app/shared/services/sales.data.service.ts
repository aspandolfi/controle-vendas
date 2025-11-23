import { Injectable } from '@angular/core';
import { Payment } from '../payment.model';
import { Sale } from '../sale.model';
import { Customer } from '../customer.model';

@Injectable({
  providedIn: 'root',
})
export class SalesDataService {
  private customers: Customer[] = [];
  private sales: Sale[] = [];
  private payments: Payment[] = [];

  private customerIdCounter = 1;
  private saleIdCounter = 1;
  private paymentIdCounter = 1;

  constructor() {
    this.initializeFakeData();
  }

  private initializeFakeData(): void {
    // Criar 10 clientes
    const customerData = [
      { name: 'João Silva', phone: '(11) 98765-4321', address: 'Rua das Flores, 123 - São Paulo/SP', authorizedPeople: [{ name: 'Maria Silva', phone: '(11) 98765-4322' }] },
      { name: 'Maria Santos', phone: '(11) 97654-3210', address: 'Av. Paulista, 1000 - São Paulo/SP', authorizedPeople: [] },
      { name: 'Pedro Oliveira', phone: '(21) 96543-2109', address: 'Rua do Comércio, 456 - Rio de Janeiro/RJ', authorizedPeople: [{ name: 'Ana Oliveira', phone: '(21) 96543-2110' }] },
      { name: 'Ana Costa', phone: '(21) 95432-1098', address: 'Av. Atlântica, 789 - Rio de Janeiro/RJ', authorizedPeople: [] },
      { name: 'Carlos Souza', phone: '(31) 94321-0987', address: 'Rua da Bahia, 321 - Belo Horizonte/MG', authorizedPeople: [{ name: 'Roberto Souza', phone: '(31) 94321-0988' }] },
      { name: 'Julia Lima', phone: '(31) 93210-9876', address: 'Av. Afonso Pena, 654 - Belo Horizonte/MG', authorizedPeople: [] },
      { name: 'Roberto Alves', phone: '(41) 92109-8765', address: 'Rua XV de Novembro, 987 - Curitiba/PR', authorizedPeople: [] },
      { name: 'Fernanda Rocha', phone: '(41) 91098-7654', address: 'Av. Batel, 147 - Curitiba/PR', authorizedPeople: [{ name: 'Carlos Rocha', phone: '(41) 91098-7655' }] },
      { name: 'Marcos Pereira', phone: '(51) 90987-6543', address: 'Rua dos Andradas, 258 - Porto Alegre/RS', authorizedPeople: [] },
      { name: 'Patricia Dias', phone: '(51) 89876-5432', address: 'Av. Borges de Medeiros, 369 - Porto Alegre/RS', authorizedPeople: [{ name: 'João Dias', phone: '(51) 89876-5433' }] }
    ];

    customerData.forEach(c => {
      this.addCustomer(c);
    });

    // Criar vendas dos últimos 2 meses
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    // Produtos de exemplo
    const products = [
      'Notebook Dell', 'Mouse Logitech', 'Teclado Mecânico', 'Monitor LG 24"',
      'Webcam Full HD', 'Headset Gamer', 'SSD 500GB', 'Memória RAM 16GB',
      'Placa de Vídeo', 'Processador Intel', 'Gabinete Gamer', 'Fonte 600W',
      'Cadeira Gamer', 'Mesa para Computador', 'Mousepad Grande', 'Microfone USB'
    ];

    // Gerar vendas aleatórias
    for (let i = 0; i < 60; i++) {
      const randomDays = Math.floor(Math.random() * 60);
      const saleDate = new Date(twoMonthsAgo);
      saleDate.setDate(saleDate.getDate() + randomDays);
      
      const isCredit = Math.random() > 0.4; // 60% a prazo, 40% à vista
      const product = products[Math.floor(Math.random() * products.length)];
      const amount = Math.floor(Math.random() * 3000) + 100; // Entre 100 e 3100

      if (isCredit) {
        // Venda a prazo
        const customerId = Math.floor(Math.random() * 10) + 1;
        this.addSale({
          customerId,
          type: 'PRAZO',
          description: product,
          date: saleDate.toISOString().split('T')[0],
          totalAmount: amount
        });
      } else {
        // Venda à vista
        this.addSale({
          type: 'AVULSO',
          description: product,
          date: saleDate.toISOString().split('T')[0],
          totalAmount: amount
        });
      }
    }

    // Adicionar alguns pagamentos para vendas a prazo
    const creditSales = this.sales.filter(s => s.type === 'PRAZO');
    const salesToPay = creditSales.slice(0, Math.floor(creditSales.length * 0.3)); // 30% com pagamento

    salesToPay.forEach(sale => {
      const paymentAmount = Math.floor(sale.remainingBalance * (0.3 + Math.random() * 0.5)); // 30% a 80% do valor
      const paymentDate = new Date(sale.date);
      paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 20) + 5); // 5 a 25 dias depois

      this.addPayment({
        customerId: sale.customerId!,
        saleId: sale.id,
        date: paymentDate.toISOString().split('T')[0],
        amount: paymentAmount
      });
    });
  }

  // --- Clientes ---
  getCustomers(): Customer[] {
    return [...this.customers];
  }

  addCustomer(customer: Omit<Customer, 'id'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: this.customerIdCounter++
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  updateCustomer(updated: Customer): void {
    const index = this.customers.findIndex(c => c.id === updated.id);
    if (index >= 0) {
      this.customers[index] = { ...updated };
    }
  }

  // --- Vendas ---
  getSales(): Sale[] {
    return [...this.sales];
  }

  getSalesByCustomer(customerId: number): Sale[] {
    return this.sales.filter(s => s.customerId === customerId);
  }

  addSale(sale: Omit<Sale, 'id' | 'remainingBalance'>): Sale {
    const newSale: Sale = {
      ...sale,
      id: this.saleIdCounter++,
      // Vendas à vista (AVULSO) não têm saldo em aberto
      remainingBalance: sale.type === 'AVULSO' ? 0 : sale.totalAmount
    };
    this.sales.push(newSale);
    return newSale;
  }

  // --- Pagamentos / Abatimento parcial ---
  getPayments(): Payment[] {
    return [...this.payments];
  }

  addPayment(payment: Omit<Payment, 'id'>): Payment | null {
    const customerOpenBalance = this.getCustomerOpenBalance(payment.customerId);
    
    if (payment.amount <= 0 || payment.amount > customerOpenBalance) {
      return null;
    }

    const newPayment: Payment = {
      ...payment,
      id: this.paymentIdCounter++
    };
    this.payments.push(newPayment);

    // Abater o pagamento das vendas a prazo do cliente (da mais antiga para a mais nova)
    const customerSales = this.getSalesByCustomer(payment.customerId)
      .filter(s => s.type === 'PRAZO' && s.remainingBalance > 0)
      .sort((a, b) => a.date.localeCompare(b.date)); // Ordenar por data (mais antigas primeiro)

    let remainingPayment = payment.amount;
    
    for (const sale of customerSales) {
      if (remainingPayment <= 0) break;
      
      const amountToDeduct = Math.min(remainingPayment, sale.remainingBalance);
      sale.remainingBalance = +(sale.remainingBalance - amountToDeduct).toFixed(2);
      remainingPayment = +(remainingPayment - amountToDeduct).toFixed(2);
    }

    return newPayment;
  }

  getCustomerOpenBalance(customerId: number): number {
    return this.getSalesByCustomer(customerId)
      .filter(s => s.type === 'PRAZO') // Apenas vendas a prazo têm saldo em aberto
      .reduce((sum, s) => sum + s.remainingBalance, 0);
  }
}
