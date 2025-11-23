import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../shared/customer.model';
import { Sale } from '../shared/sale.model';
import { Payment } from '../shared/payment.model';
import { SalesDataService } from '../shared/services/sales.data.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DailySalesData {
  date: string;
  cashCount: number;
  creditCount: number;
  cashTotal: number;
  creditTotal: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.less',
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  
  customers: Customer[] = [];
  sales: Sale[] = [];
  payments: Payment[] = [];
  totalOpenBalance = 0;
  cashSalesCount = 0;
  cashSalesTotal = 0;
  paymentsTotal = 0;
  private chart?: Chart;

  // Filtros de data
  startDate: string = '';
  endDate: string = '';

  constructor(private dataService: SalesDataService) { }

  ngOnInit(): void {
    this.customers = this.dataService.getCustomers();
    this.sales = this.dataService.getSales();
    this.payments = this.dataService.getPayments();
    
    // Definir datas padrão (dia atual)
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = today.toISOString().split('T')[0];
    
    // Calcular saldo em aberto total (não afetado pelo filtro)
    this.totalOpenBalance = this.sales
      .filter(s => s.type === 'PRAZO')
      .reduce((sum, s) => sum + s.remainingBalance, 0);
    
    this.updateStatistics();
  }

  private updateStatistics(): void {
    // Filtrar vendas por data
    const filteredSales = this.sales.filter(sale => {
      const saleDate = sale.date.split('T')[0];
      return saleDate >= this.startDate && saleDate <= this.endDate;
    });
    
    // Filtrar pagamentos por data
    const filteredPayments = this.payments.filter(payment => {
      const paymentDate = payment.date.split('T')[0];
      return paymentDate >= this.startDate && paymentDate <= this.endDate;
    });
    
    // Vendas à vista (filtradas por data)
    const cashSales = filteredSales.filter(s => s.type === 'AVULSO');
    this.cashSalesCount = cashSales.length;
    this.cashSalesTotal = cashSales.reduce((sum, s) => sum + s.totalAmount, 0);
    
    // Pagamentos realizados (filtrados por data)
    this.paymentsTotal = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  onFilterChange(): void {
    this.updateStatistics();
    if (this.chart) {
      this.updateChart();
    }
  }

  private createChart(): void {
    const dailyData = this.aggregateSalesByDay();
    
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dailyData.map(d => this.formatDate(d.date)),
        datasets: [
          {
            label: 'Quantidade à Vista',
            data: dailyData.map(d => d.cashCount),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            yAxisID: 'y',
            order: 2
          },
          {
            label: 'Quantidade a Prazo',
            data: dailyData.map(d => d.creditCount),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            yAxisID: 'y',
            order: 2
          },
          {
            label: 'Valor Total à Vista (R$)',
            data: dailyData.map(d => d.cashTotal),
            type: 'line',
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            yAxisID: 'y1',
            order: 1,
            tension: 0.4
          },
          {
            label: 'Valor Total a Prazo (R$)',
            data: dailyData.map(d => d.creditTotal),
            type: 'line',
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 2,
            yAxisID: 'y1',
            order: 1,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: 'Histórico de Vendas por Dia',
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (label.includes('Valor')) {
                    label += 'R$ ' + context.parsed.y.toFixed(2);
                  } else {
                    label += context.parsed.y;
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Quantidade de Vendas'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Valor Total (R$)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
          },
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    const dailyData = this.aggregateSalesByDay();
    
    this.chart.data.labels = dailyData.map(d => this.formatDate(d.date));
    this.chart.data.datasets[0].data = dailyData.map(d => d.cashCount);
    this.chart.data.datasets[1].data = dailyData.map(d => d.creditCount);
    this.chart.data.datasets[2].data = dailyData.map(d => d.cashTotal);
    this.chart.data.datasets[3].data = dailyData.map(d => d.creditTotal);
    
    this.chart.update();
  }

  private aggregateSalesByDay(): DailySalesData[] {
    const dailyMap = new Map<string, DailySalesData>();

    // Filtrar vendas por data
    const filteredSales = this.sales.filter(sale => {
      const saleDate = sale.date.split('T')[0];
      return saleDate >= this.startDate && saleDate <= this.endDate;
    });

    filteredSales.forEach(sale => {
      const date = sale.date.split('T')[0]; // Pega apenas a data (yyyy-mm-dd)
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          cashCount: 0,
          creditCount: 0,
          cashTotal: 0,
          creditTotal: 0
        });
      }

      const dayData = dailyMap.get(date)!;
      
      if (sale.type === 'AVULSO') {
        dayData.cashCount++;
        dayData.cashTotal += sale.totalAmount;
      } else {
        dayData.creditCount++;
        dayData.creditTotal += sale.totalAmount;
      }
    });

    // Converte o Map para array e ordena por data
    return Array.from(dailyMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }

  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
}
