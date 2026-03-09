import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerList } from './customer-list';
import { CustomerService } from '../../shared/services/customer.service';
import { SaleService } from '../../shared/services/sale.service';
import { MockCustomerService, MockSaleService } from '../../shared/services/test-mocks';

describe('CustomerList', () => {
  let component: CustomerList;
  let fixture: ComponentFixture<CustomerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerList],
      providers: [
        { provide: CustomerService, useClass: MockCustomerService },
        { provide: SaleService, useClass: MockSaleService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    expect(component.customers.length).toBeGreaterThan(0);
  });
});
