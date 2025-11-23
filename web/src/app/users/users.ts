import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../shared/user.model';
import { UserService } from '../shared/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.less'
})
export class Users implements OnInit {
  users: User[] = [];
  userForm!: FormGroup;
  showModal = false;
  editingUser: User | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.buildForm();
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      name: ['', Validators.required],
      role: ['USER', Validators.required],
      active: [true],
      pin: ['', [Validators.pattern(/^\d{4}$/)]]
    });
  }

  loadUsers(): void {
    this.users = this.userService.getUsers();
  }

  openModal(user?: User): void {
    this.editingUser = user || null;
    this.errorMessage = '';

    if (user) {
      this.userForm.patchValue({
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
        active: user.active,
        pin: user.pin || ''
      });
    } else {
      this.userForm.reset({
        username: '',
        password: '',
        name: '',
        role: 'USER',
        active: true,
        pin: ''
      });
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.errorMessage = '';
    this.userForm.reset({
      username: '',
      password: '',
      name: '',
      role: 'USER',
      active: true
    });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.value;

    // Verificar se username já existe (exceto se estiver editando o mesmo usuário)
    const existingUser = this.userService.getUserByUsername(formValue.username);
    if (existingUser && (!this.editingUser || existingUser.id !== this.editingUser.id)) {
      this.errorMessage = 'Nome de usuário já existe.';
      return;
    }

    if (this.editingUser) {
      // Atualizar usuário
      const updatedUser: User = {
        ...this.editingUser,
        username: formValue.username,
        password: formValue.password,
        name: formValue.name,
        role: formValue.role,
        active: formValue.active,
        pin: formValue.pin || undefined
      };

      if (this.userService.updateUser(updatedUser)) {
        this.loadUsers();
        this.closeModal();
      } else {
        this.errorMessage = 'Erro ao atualizar usuário.';
      }
    } else {
      // Criar novo usuário
      this.userService.addUser({
        username: formValue.username,
        password: formValue.password,
        name: formValue.name,
        role: formValue.role,
        active: formValue.active,
        pin: formValue.pin || undefined
      });

      this.loadUsers();
      this.closeModal();
    }
  }

  deleteUser(user: User): void {
    if (user.username === 'admin') {
      alert('Não é possível excluir o usuário administrador padrão.');
      return;
    }

    if (confirm(`Deseja realmente excluir o usuário "${user.name}"?`)) {
      if (this.userService.deleteUser(user.id)) {
        this.loadUsers();
      }
    }
  }

  toggleUserStatus(user: User): void {
    if (user.username === 'admin') {
      alert('Não é possível desativar o usuário administrador padrão.');
      return;
    }

    const updatedUser: User = {
      ...user,
      active: !user.active
    };

    this.userService.updateUser(updatedUser);
    this.loadUsers();
  }
}
