import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashSales } from './cash-sales';

describe('CashSales', () => {
  let component: CashSales;
  let fixture: ComponentFixture<CashSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashSales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashSales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
