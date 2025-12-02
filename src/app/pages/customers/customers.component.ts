import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuComponent } from '../../commons/menu/menu.component';

type Customer = {
  idCustomer: string;
  name: string;
  address?: string | null;
  email: string;
  phoneNumber?: string | null;
};

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MenuComponent, ReactiveFormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly baseUrl = 'https://perpetual-gentleness-production.up.railway.app/api/customers';


  readonly searchForm = this.fb.nonNullable.group({
    phone: ['', Validators.required]
  });

  readonly customer = signal<Customer | null>(null);
  readonly isLoading = signal(false);
  readonly feedback = signal('');

  search(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const phone = this.searchForm.controls.phone.value.trim();
    if (!phone) {
      this.feedback.set('Escribe un teléfono.');
      return;
    }

    this.isLoading.set(true);
    this.feedback.set('');
    this.customer.set(null);

    this.http
      .get<Customer>(`${this.baseUrl}/phone/${encodeURIComponent(phone)}`)
      .subscribe({
        next: (data) => {
          this.customer.set(data);
          if (!data) {
            this.feedback.set('No se encontró cliente con ese teléfono.');
          }
        },
        error: () => this.feedback.set('No se pudo buscar el cliente.'),
        complete: () => this.isLoading.set(false)
      });
  }

  clear(): void {
    this.searchForm.reset({ phone: '' });
    this.customer.set(null);
    this.feedback.set('');
  }
}
