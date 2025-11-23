export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  active: boolean;
  pin?: string;  // PIN de 4 dígitos para operações sensíveis
  createdAt: string;
}
