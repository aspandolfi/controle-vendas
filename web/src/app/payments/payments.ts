// src/app/pages/payments/payments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Customer } from '../shared/customer.model';
import { Sale } from '../shared/sale.model';
import { Payment, PaymentByCustomer } from '../shared/payment.model';
import { SalesDataService } from '../shared/services/sales.data.service';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payments.html'
})
export class Payments implements OnInit {
  customers: Customer[] = [];
  selectedCustomerId: number | null = null;
  salesForCustomer: Sale[] = [];

  paymentForm!: FormGroup;
  pinForm!: FormGroup;
  payments: Payment[] = [];
  paymentByCustomer: PaymentByCustomer[] = [];
  filteredPaymentByCustomer: PaymentByCustomer[] = [];

  errorMessage = '';
  searchText: string = '';
  filteredCustomers: Customer[] = [];
  showModal = false;
  showPinModal = false;
  pinErrorMessage = '';

  // Filtros de data
  startDate: string = '';
  endDate: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: SalesDataService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.customers = this.dataService.getCustomers();
    this.payments = this.dataService.getPayments();
    this.paymentByCustomer = this.payments.map(p => ({
      id: p.id,
      customerName: this.customers.find(c => c.id === p.customerId)?.name || '',
      customerId: p.customerId,
      saleId: p.saleId,
      amount: p.amount,
      date: p.date,
      sale: p.saleId ? this.getSaleById(p.saleId) : undefined,
    }));
    
    // Definir datas padrão (últimos 30 dias)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    this.filterPayments();
    this.buildForm();
  }

  buildForm(): void {
    this.paymentForm = this.fb.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.pinForm = this.fb.group({
      pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
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
    this.onCustomerChange();
    this.showModal = true;
    this.searchText = '';
    this.filteredCustomers = [];
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedCustomerId = null;
    this.salesForCustomer = [];
    this.errorMessage = '';
    this.paymentForm.reset({
      date: new Date().toISOString().substring(0, 10),
      amount: 0
    });
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : '';
  }

  onCustomerChange(): void {
    if (this.selectedCustomerId) {
      this.salesForCustomer = this.dataService
        .getSalesByCustomer(this.selectedCustomerId)
        .filter(s => s.type === 'PRAZO' && s.remainingBalance > 0)
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      this.salesForCustomer = [];
    }
  }

  submitPayment(): void {
    this.errorMessage = '';

    if (!this.selectedCustomerId) {
      this.errorMessage = 'Selecione o cliente.';
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const value = this.paymentForm.value;
    const customerBalance = this.getCustomerOpenBalance(this.selectedCustomerId);

    if (value.amount > customerBalance) {
      this.errorMessage = `Valor do pagamento (R$ ${value.amount.toFixed(2)}) excede o saldo em aberto do cliente (R$ ${customerBalance.toFixed(2)}).`;
      return;
    }

    // Solicitar PIN antes de processar o pagamento
    this.openPinModal();
  }

  private processPayment(): void {
    const value = this.paymentForm.value;

    const result = this.dataService.addPayment({
      customerId: this.selectedCustomerId!,
      date: value.date,
      amount: value.amount
    });

    if (!result) {
      this.errorMessage = 'Erro ao registrar pagamento.';
      return;
    }

    // Atualizar vendas do cliente
    this.salesForCustomer = this.dataService
      .getSalesByCustomer(this.selectedCustomerId!)
      .filter(s => s.type === 'PRAZO' && s.remainingBalance > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    this.payments = this.dataService.getPayments();
    this.paymentByCustomer = this.payments.map(p => ({
      id: p.id,
      customerName: this.customers.find(c => c.id === p.customerId)?.name || '',
      customerId: p.customerId,
      saleId: p.saleId,
      amount: p.amount,
      date: p.date,
      sale: this.getSaleById(p.saleId!),
    }));
    
    this.filterPayments();

    this.paymentForm.reset({
      date: new Date().toISOString().substring(0, 10),
      amount: 0
    });

    this.errorMessage = '';
    this.closeModal();
  }

  openPinModal(): void {
    this.pinErrorMessage = '';
    this.pinForm.reset();
    this.showPinModal = true;
  }

  closePinModal(): void {
    this.showPinModal = false;
    this.pinErrorMessage = '';
    this.pinForm.reset();
  }

  validatePinAndSubmit(): void {
    this.pinErrorMessage = '';

    if (this.pinForm.invalid) {
      this.pinForm.markAllAsTouched();
      return;
    }

    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.pinErrorMessage = 'Usuário não autenticado.';
      return;
    }

    const pin = this.pinForm.value.pin;
    const isValid = this.userService.validatePin(currentUser.id, pin);

    if (isValid) {
      this.closePinModal();
      this.processPayment();
    } else {
      this.pinErrorMessage = 'PIN inválido. Tente novamente.';
    }
  }

  onDateFilterChange(): void {
    this.filterPayments();
  }

  private filterPayments(): void {
    this.filteredPaymentByCustomer = this.paymentByCustomer.filter(p => {
      const paymentDate = p.date.split('T')[0];
      return paymentDate >= this.startDate && paymentDate <= this.endDate;
    });
  }

  getSaleById(id: number): Sale | undefined {
    return this.dataService.getSales().find(s => s.id === id);
  }

  getCustomerOpenBalance(customerId: number): number {
    return this.dataService.getCustomerOpenBalance(customerId);
  }
}