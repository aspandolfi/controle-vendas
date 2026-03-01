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
import { SalesDataService } from '../../shared/services/sales.data.service';
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

  constructor(
    private fb: FormBuilder,
    private dataService: SalesDataService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.buildForm();
  }

  loadCustomers(): void {
    this.customers = this.dataService.getCustomers();
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
      this.dataService.updateCustomer(updated);
    } else {
      this.dataService.addCustomer({
        name: value.name,
        phone: value.phone,
        address: value.address,
        authorizedPeople: value.authorizedPeople
      });
    }

    this.loadCustomers();
    this.closeModal();
  }

  getCustomerBalance(customerId: number): number {
    return this.dataService.getCustomerOpenBalance(customerId);
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
