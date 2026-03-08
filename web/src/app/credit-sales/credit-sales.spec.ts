import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreditSales } from './credit-sales';
import { CustomerService } from '../shared/services/customer.service';
import { SaleService } from '../shared/services/sale.service';
import { MockCustomerService, MockSaleService } from '../shared/services/test-mocks';

describe('CreditSales', () => {
  let component: CreditSales;
  let fixture: ComponentFixture<CreditSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditSales],
      providers: [
        { provide: CustomerService, useClass: MockCustomerService },
        { provide: SaleService, useClass: MockSaleService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditSales);
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
