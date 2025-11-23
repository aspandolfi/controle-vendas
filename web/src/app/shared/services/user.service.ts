import { Injectable } from '@angular/core';
import { User } from '../user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: User[] = [];
  private userIdCounter = 1;

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers(): void {
    // Criar usuário admin padrão
    this.users.push({
      id: this.userIdCounter++,
      username: 'admin',
      password: 'admin',
      name: 'Administrador',
      role: 'ADMIN',
      active: true,
      pin: '1234',
      createdAt: new Date().toISOString()
    });
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: this.userIdCounter++,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(updatedUser: User): boolean {
    const index = this.users.findIndex(u => u.id === updatedUser.id);
    if (index >= 0) {
      this.users[index] = { ...updatedUser };
      return true;
    }
    return false;
  }

  deleteUser(id: number): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  authenticate(username: string, password: string): User | null {
    const user = this.users.find(
      u => u.username === username && u.password === password && u.active
    );
    return user || null;
  }

  validatePin(userId: number, pin: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user || !user.pin) {
      return false;
    }
    return user.pin === pin;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
}
