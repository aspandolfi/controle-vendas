import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditSales } from './credit-sales';

describe('CreditSales', () => {
  let component: CreditSales;
  let fixture: ComponentFixture<CreditSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditSales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditSales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
