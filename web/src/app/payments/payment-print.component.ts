import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaymentPrintData {
  customerName: string;
  date: string;
  openBalance: number;
  sales: {
    date: string;
    description: string;
    remainingBalance: number;
  }[];
}

@Component({
  selector: 'app-payment-print',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-print.component.html',
  styleUrls: ['./payment-print.component.less']
})
export class PaymentPrintComponent {
  @Input() data!: PaymentPrintData;

  get emissionDate(): string {
    return new Date().toLocaleString('pt-BR');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2)}`;
  }
}
