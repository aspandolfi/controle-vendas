import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { CustomerService } from '../shared/services/customer.service';
import { SaleService } from '../shared/services/sale.service';
import { PaymentService } from '../shared/services/payment.service';
import { MockCustomerService, MockSaleService, MockPaymentService } from '../shared/services/test-mocks';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: CustomerService, useClass: MockCustomerService },
        { provide: SaleService, useClass: MockSaleService },
        { provide: PaymentService, useClass: MockPaymentService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(component.customers).toBeDefined();
    expect(component.sales).toBeDefined();
    expect(component.payments).toBeDefined();
  });
});
