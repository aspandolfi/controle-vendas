import { Component, OnInit } from '@angular/core';
import { Customer } from '../shared/customer.model';
import { Sale } from '../shared/sale.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SalesDataService } from '../shared/services/sales.data.service';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-sales',
  imports: [DecimalPipe, ReactiveFormsModule, DatePipe, CommonModule, FormsModule],
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
      totalAmount: [0, [Validators.required, Validators.min(0.01)]]
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
      totalAmount: value.totalAmount
    });

    this.saleForm.reset({
      description: '',
      date: new Date().toISOString().substring(0, 10),
      totalAmount: 0
    });
    this.selectCustomer(this.selectedCustomerId);
  }
  
  getCustomerOpenBalance(customerId: number): number {
    return this.dataService.getCustomerOpenBalance(customerId);
  }
}
