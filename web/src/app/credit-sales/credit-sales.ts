import { Component, OnInit } from '@angular/core';
import { Customer } from '../shared/customer.model';
import { Sale, PaymentMethod } from '../shared/sale.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SalesDataService } from '../shared/services/sales.data.service';
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

  constructor(
    private dataService: SalesDataService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.customers = this.dataService.getCustomers();
    this.buildForm();
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
    this.salesForCustomer = this.dataService.getSalesByCustomer(customerId);
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
      this.salesForCustomer = this.dataService.getSalesByCustomer(this.selectedCustomerId);
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
    this.dataService.addSale({
      customerId: this.selectedCustomerId,
      type: 'PRAZO',
      description: value.description,
      date: value.date,
      totalAmount: value.totalAmount,
      paymentMethod: value.paymentMethod
    });

    this.saleForm.reset({
      description: '',
      date: new Date().toISOString().substring(0, 10),
      totalAmount: 0,
      paymentMethod: 'DINHEIRO'
    });
    this.selectCustomer(this.selectedCustomerId);
    this.closeModal();
  }
  
  getCustomerOpenBalance(customerId: number): number {
    return this.dataService.getCustomerOpenBalance(customerId);
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
