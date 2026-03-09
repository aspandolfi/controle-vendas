import { Component, OnInit } from '@angular/core';
import { Customer } from '../shared/customer.model';
import { Sale, PaymentMethod } from '../shared/sale.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CustomerService } from '../shared/services/customer.service';
import { SaleService } from '../shared/services/sale.service';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { Pagination } from '../shared/components/pagination/pagination';

@Component({
  selector: 'app-credit-sales',
  imports: [DecimalPipe, ReactiveFormsModule, DatePipe, CommonModule, FormsModule, Pagination],
  templateUrl: './credit-sales.html',
  styleUrl: './credit-sales.less',
})
export class CreditSales implements OnInit {
  customers: Customer[] = [];
  selectedCustomerId: number | null = null;
  salesForCustomer: Sale[] = [];
  saleForm!: FormGroup;
  searchText: string = '';
  filteredCustomers: Customer[] = [];
  showModal = false;
  currentPageSearch = 1;
  currentPageSales = 1;
  itemsPerPage = 10;
  customerBalances: Map<number, number> = new Map();

  constructor(
    private customerService: CustomerService,
    private saleService: SaleService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.buildForm();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loadCustomerBalances();
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
      }
    });
  }

  loadCustomerBalances(): void {
    this.customers.forEach(customer => {
      this.saleService.getCustomerOpenBalance(customer.id).subscribe({
        next: (balance) => {
          this.customerBalances.set(customer.id, balance);
        },
        error: (error) => {
          console.error(`Erro ao carregar saldo do cliente ${customer.id}:`, error);
        }
      });
    });
  }

  buildForm(): void {
    this.saleForm = this.fb.group({
      description: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['DINHEIRO', Validators.required]
    });
  }

  onSearchChange(): void {
    if (this.searchText.trim()) {
      this.filteredCustomers = this.customers.filter(c => 
        c.name.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.filteredCustomers = [];
    }
  }

  selectCustomer(customerId: number): void {
    this.selectedCustomerId = customerId;
    this.saleService.getSalesByCustomer(customerId).subscribe({
      next: (sales) => {
        this.salesForCustomer = sales;
      },
      error: (error) => {
        console.error('Erro ao carregar vendas do cliente:', error);
      }
    });
  }

  selectCustomerAndOpenModal(customerId: number): void {
    this.selectCustomer(customerId);
    this.showModal = true;
  }

  openModal(): void {
    if (!this.selectedCustomerId) return;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saleForm.reset({
      description: '',
      date: new Date().toISOString().substring(0, 10),
      totalAmount: 0,
      paymentMethod: 'DINHEIRO'
    });
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  }

  onCustomerChange($event: any): void {
    this.selectedCustomerId = $event;
    if (this.selectedCustomerId) {
      this.saleService.getSalesByCustomer(this.selectedCustomerId).subscribe({
        next: (sales) => {
          this.salesForCustomer = sales;
        },
        error: (error) => {
          console.error('Erro ao carregar vendas do cliente:', error);
        }
      });
    } else {
      this.salesForCustomer = [];
    }
  }

  saveSale(): void {
    if (!this.selectedCustomerId) {
      return;
    }
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    const value = this.saleForm.value;
    this.saleService.addSale({
      customerId: this.selectedCustomerId,
      type: 'PRAZO',
      description: value.description,
      date: value.date,
      totalAmount: value.totalAmount,
      paymentMethod: value.paymentMethod
    }).subscribe({
      next: () => {
        this.saleForm.reset({
          description: '',
          date: new Date().toISOString().substring(0, 10),
          totalAmount: 0,
          paymentMethod: 'DINHEIRO'
        });
        if (this.selectedCustomerId) {
          this.selectCustomer(this.selectedCustomerId);
        }
        this.closeModal();
      },
      error: (error) => {
        console.error('Erro ao salvar venda:', error);
      }
    });
  }
  
  getCustomerOpenBalance(customerId: number): number {
    return this.customerBalances.get(customerId) || 0;
  }

  getPaymentMethodLabel(method?: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      DINHEIRO: 'Dinheiro',
      PIX: 'Pix',
      CARTAO_CREDITO: 'Cartão de Crédito',
      CARTAO_CREDITO_PARCELADO: 'Cartão de Crédito Parcelado',
      CARTAO_DEBITO: 'Cartão de Débito'
    };
    return method ? labels[method] : '-';
  }

  get paginatedFilteredCustomers(): Customer[] {
    const startIndex = (this.currentPageSearch - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCustomers.slice(startIndex, endIndex);
  }

  get totalPagesSearch(): number {
    return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  onPageChangeSearch(page: number): void {
    this.currentPageSearch = page;
  }

  get paginatedSalesForCustomer(): Sale[] {
    const startIndex = (this.currentPageSales - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.salesForCustomer.slice(startIndex, endIndex);
  }

  get totalPagesSales(): number {
    return Math.ceil(this.salesForCustomer.length / this.itemsPerPage);
  }

  onPageChangeSales(page: number): void {
    this.currentPageSales = page;
  }
}
