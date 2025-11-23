import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Sale } from '../shared/sale.model';
import { SalesDataService } from '../shared/services/sales.data.service';

@Component({
  selector: 'app-cash-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cash-sales.html'
})
export class CashSales implements OnInit {
  saleForm!: FormGroup;
  sales: Sale[] = [];

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
      totalAmount: [0, [Validators.required, Validators.min(0.01)]]
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
      totalAmount: value.totalAmount
    });

    this.saleForm.reset({
      description: '',
      date: new Date().toISOString().substring(0, 10),
      totalAmount: 0
    });
    this.loadSales();
  }
}