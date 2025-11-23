// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { CreditSales } from './credit-sales/credit-sales';
import { CashSales } from './cash-sales/cash-sales';
import { Payments } from './payments/payments';
import { CustomerList } from './customers/customer-list/customer-list';
import { Users } from './users/users';
import { Login } from './login/login';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'vendas-prazo', component: CreditSales, canActivate: [authGuard] },
  { path: 'vendas-avulso', component: CashSales, canActivate: [authGuard] },
  { path: 'pagamentos', component: Payments, canActivate: [authGuard] },
  { path: 'clientes', component: CustomerList, canActivate: [authGuard] },
  { path: 'usuarios', component: Users, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];