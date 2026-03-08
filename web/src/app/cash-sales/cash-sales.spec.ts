import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CashSales } from './cash-sales';
import { SaleService } from '../shared/services/sale.service';
import { MockSaleService } from '../shared/services/test-mocks';

describe('CashSales', () => {
  let component: CashSales;
  let fixture: ComponentFixture<CashSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashSales],
      providers: [
        { provide: SaleService, useClass: MockSaleService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashSales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sales on init', () => {
    expect(component.sales).toBeDefined();
  });
});
