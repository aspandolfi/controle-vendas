import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Payments } from './payments';
import { CustomerService } from '../shared/services/customer.service';
import { SaleService } from '../shared/services/sale.service';
import { PaymentService } from '../shared/services/payment.service';
import { UserService } from '../shared/services/user.service';
import { MockCustomerService, MockSaleService, MockPaymentService } from '../shared/services/test-mocks';

describe('Payments', () => {
  let component: Payments;
  let fixture: ComponentFixture<Payments>;
  let mockUserService: any;

  beforeEach(async () => {
    mockUserService = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
      validatePin: vi.fn().mockReturnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [Payments, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: CustomerService, useClass: MockCustomerService },
        { provide: SaleService, useClass: MockSaleService },
        { provide: PaymentService, useClass: MockPaymentService },
        { provide: UserService, useValue: mockUserService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Payments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(component.customers.length).toBeGreaterThan(0);
  });

  it('should load payments on init', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(component.payments).toBeDefined();
  });

  describe('printPayment', () => {
    beforeEach(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      component.selectedCustomerId = 1;
      component.salesForCustomer = [{
        id: 1,
        customerId: 1,
        type: 'PRAZO',
        date: '2026-02-01',
        description: 'Venda 1',
        totalAmount: 100,
        remainingBalance: 50
      }];
      component.paymentForm.patchValue({ date: '2026-02-25', amount: 50 });
    });

    it('should not print if no customer is selected', () => {
      component.selectedCustomerId = null;
      const printSpy = vi.spyOn(window, 'print');
      component.printPayment();
      expect(printSpy).not.toHaveBeenCalled();
    });
  });
});
