import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Customer } from '../../shared/customer.model';
import { CustomerService } from '../../shared/services/customer.service';
import { SaleService } from '../../shared/services/sale.service';
import { Pagination } from '../../shared/components/pagination/pagination';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Pagination],
  templateUrl: './customer-list.html'
})
export class CustomerList implements OnInit {
  customers: Customer[] = [];
  customerForm!: FormGroup;
  editingCustomer: Customer | null = null;
  showModal = false;
  currentPage = 1;
  itemsPerPage = 10;
  customerBalances: Map<number, number> = new Map();

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private saleService: SaleService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.buildForm();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        // Carregar saldos para cada cliente
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

  buildForm(customer?: Customer): void {
    this.customerForm = this.fb.group({
      name: [customer?.name || '', [Validators.required]],
      phone: [customer?.phone || '', [Validators.required]],
      address: [customer?.address || '', [Validators.required]],
      authorizedPeople: this.fb.array(
        (customer?.authorizedPeople || []).map(p =>
          this.fb.group({
            name: [p.name, Validators.required],
            document: [p.document || ''],
            phone: [p.phone || '']
          })
        )
      )
    });
  }

  get authorizedPeople(): FormArray {
    return this.customerForm.get('authorizedPeople') as FormArray;
  }

  addAuthorizedPerson(): void {
    this.authorizedPeople.push(
      this.fb.group({
        name: ['', Validators.required],
        document: [''],
        phone: ['']
      })
    );
  }

  removeAuthorizedPerson(index: number): void {
    this.authorizedPeople.removeAt(index);
  }

  startNew(): void {
    this.editingCustomer = null;
    this.buildForm();
    this.showModal = true;
  }

  edit(customer: Customer): void {
    this.editingCustomer = customer;
    this.buildForm(customer);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCustomer = null;
    this.buildForm();
  }

  save(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const value = this.customerForm.value;

    if (this.editingCustomer) {
      const updated: Customer = {
        ...this.editingCustomer,
        ...value
      };
      this.customerService.updateCustomer(updated).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erro ao atualizar cliente:', error);
        }
      });
    } else {
      this.customerService.addCustomer({
        name: value.name,
        phone: value.phone,
        address: value.address,
        authorizedPeople: value.authorizedPeople
      }).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erro ao criar cliente:', error);
        }
      });
    }
  }

  getCustomerBalance(customerId: number): number {
    return this.customerBalances.get(customerId) || 0;
  }

  get paginatedCustomers(): Customer[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.customers.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.customers.length / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }
}
