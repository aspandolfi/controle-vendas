// src/app/shared/models/customer.model.ts
export interface AuthorizedPerson {
  name: string;
  document?: string;
  phone?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  authorizedPeople: AuthorizedPerson[];
}