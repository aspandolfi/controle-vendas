import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Payments } from './payments';
import { SalesDataService } from '../shared/services/sales.data.service';
import { UserService } from '../shared/services/user.service';

const mockGeneratePaymentPrintTemplate = vi.fn();
vi.mock('./payment-print.template', () => ({
  generatePaymentPrintTemplate: mockGeneratePaymentPrintTemplate
}));

describe('Payments', () => {
  let component: Payments;
  let fixture: ComponentFixture<Payments>;
  let mockSalesDataService: any;
  let mockUserService: any;

  beforeEach(async () => {
    mockSalesDataService = {
      getCustomers: vi.fn().mockReturnValue([]),
      getSales: vi.fn().mockReturnValue([]),
      getPayments: vi.fn().mockReturnValue([]),
      addPayment: vi.fn().mockResolvedValue({})
    };

    mockUserService = {
      validatePin: vi.fn().mockResolvedValue(true)
    };

    mockGeneratePaymentPrintTemplate.mockReset().mockResolvedValue('<html><body>Test</body></html>');

    await TestBed.configureTestingModule({
      imports: [Payments, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: SalesDataService, useValue: mockSalesDataService },
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

  describe('printPayment', () => {
    beforeEach(() => {
      component.customers = [{ id: 1, name: 'Cliente Teste', active: true }] as any;
      component.selectedCustomerId = 1;
      component.salesForCustomer = [{
        id: 1,
        customerId: 1,
        date: '2026-02-01',
        description: 'Venda 1',
        totalValue: 100,
        remainingBalance: 50
      }] as any;
      component.paymentForm = component['fb'].group({ date: '2026-02-25', amount: 50 });
    });

    it('should not print if no customer is selected', async () => {
      component.selectedCustomerId = null;
      const createElementSpy = vi.spyOn(document, 'createElement');
      await component.printPayment();
      expect(createElementSpy).not.toHaveBeenCalled();
    });

    it('should create and configure iframe', async () => {
      let iframe: HTMLIFrameElement | null = null;
      const originalCreateElement = document.createElement.bind(document);
      
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'iframe') iframe = el as HTMLIFrameElement;
        return el;
      });
      vi.spyOn(document.body, 'appendChild');
      await component.printPayment();
      expect(iframe).toBeTruthy();
      expect(iframe!.style.position).toBe('absolute');
    });

    it('should call template with correct data', async () => {
      const originalCreateElement = document.createElement.bind(document);
      
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el: any = originalCreateElement(tag);
        el.contentWindow = null;
        return el;
      });
      await component.printPayment();
      expect(mockGeneratePaymentPrintTemplate).toHaveBeenCalledWith({
        customerName: 'Cliente Teste',
        date: '2026-02-25',
        openBalance: 50,
        sales: [{ date: '2026-02-01', description: 'Venda 1', remainingBalance: 50 }]
      });
    });
  });
});
