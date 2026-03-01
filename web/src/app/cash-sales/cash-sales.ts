import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Sale, PaymentMethod } from '../shared/sale.model';
import { SalesDataService } from '../shared/services/sales.data.service';
import { Pagination } from '../shared/components/pagination/pagination';

@Component({
  selector: 'app-cash-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Pagination],
  templateUrl: './cash-sales.html'
})
export class CashSales implements OnInit {
  saleForm!: FormGroup;
  sales: Sale[] = [];
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private fb: FormBuilder,
    private dataService: SalesDataService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadSales();
  }

  buildForm(): void {
    this.saleForm = this.fb.group({
      description: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['DINHEIRO', Validators.required]
    });
  }

  loadSales(): void {
    this.sales = this.dataService.getSales().filter(s => s.type === 'AVULSO');
  }

  saveSale(): void {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    const value = this.saleForm.value;
    this.dataService.addSale({
      type: 'AVULSO',
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
    this.loadSales();
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

  get paginatedSales(): Sale[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.sales.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.sales.length / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }
}