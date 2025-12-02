import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuComponent } from '../../commons/menu/menu.component';

// === MODELOS ===
type Pizza = {
  idPizza: number;
  name: string;
  description: string;
  price: number;
  vegetarian: boolean;
  vegan: boolean;
  available: boolean;
};

type OrderItem = {
  idOrder?: number;
  idItem?: number;
  idPizza: number;
  quantity: number;
  price: number;
  pizza?: Pizza;
};

type Order = {
  idOrder: number;
  idCustomer: string;
  date: string;
  total: number;
  method: string;
  additionalNotes?: string | null;
  items?: OrderItem[];
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

// 👇 NUEVO: modelo de cliente
type Customer = {
  idCustomer: string;
  name: string;
  address?: string | null;
  email: string;
  phoneNumber?: string | null;
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MenuComponent, ReactiveFormsModule],
  templateUrl: './chargers.component.html',
  styleUrl: './chargers.component.css'
})
export class OrdersComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

readonly ordersBaseUrl = 'https://perpetual-gentleness-production.up.railway.app/api/orders';
readonly pizzasBaseUrl = 'https://perpetual-gentleness-production.up.railway.app/api/pizzas';
readonly customersBaseUrl = 'https://perpetual-gentleness-production.up.railway.app/api/customers';


  orders = signal<Order[]>([]);
  pizzas = signal<Pizza[]>([]);
  // 👇 NUEVO: clientes y mapa idCustomer -> phoneNumber
  customers = signal<Customer[]>([]);
  customerPhones = signal<Record<string, string>>({});

  isLoading = signal(false);
  isSubmitting = signal(false);
  feedback = signal('');
  editingId = signal<number | null>(null);

  // 🔹 Formulario de pedido con pizza incluida
  orderForm = this.fb.group({
    idCustomer: ['', Validators.required],
    date: [''], // opcional, backend puede ponerla
    method: ['', Validators.required],
    additionalNotes: [''],

    // Datos de la pizza elegida
    pizzaId: [null as number | null, Validators.required],
    pizzaQuantity: [1, [Validators.required, Validators.min(1)]],
    pizzaPrice: [0, [Validators.required, Validators.min(0)]],

    // Total calculado
    total: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    this.loadAll();
    this.loadPizzas();
    this.loadCustomers(); // 👈 NUEVO
  }

  // ======================
  //   PIZZAS PARA PEDIDO
  // ======================
  loadPizzas(): void {
    this.http
      .get<Page<Pizza>>(`${this.pizzasBaseUrl}?page=0&elements=50`)
      .subscribe({
        next: (pageData) => this.pizzas.set(pageData?.content ?? []),
        error: () =>
          this.feedback.set('No se pudieron cargar las pizzas para el pedido.')
      });
  }

  onPizzaChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (!select) {
      return;
    }

    const pizzaId = Number(select.value);
    const pizza = this.pizzas().find((p) => p.idPizza === pizzaId);
    if (!pizza) {
      return;
    }

    this.orderForm.patchValue({
      pizzaPrice: pizza.price
    });
    this.updateTotal();
  }

  onQuantityOrPriceChange(): void {
    this.updateTotal();
  }

  private updateTotal(): void {
    const value = this.orderForm.getRawValue();
    const qty = Number(value.pizzaQuantity ?? 0);
    const price = Number(value.pizzaPrice ?? 0);
    const total = qty * price;
    this.orderForm.patchValue({ total });
  }

  // ======================
  //   CLIENTES (TELÉFONOS)
  // ======================
  loadCustomers(): void {
    this.http.get<Customer[]>(this.customersBaseUrl).subscribe({
      next: (customers) => {
        this.customers.set(customers);

        const map: Record<string, string> = {};
        for (const c of customers) {
          if (c.idCustomer && c.phoneNumber) {
            map[c.idCustomer] = c.phoneNumber;
          }
        }
        this.customerPhones.set(map);
      },
      error: () =>
        this.feedback.set('No se pudieron cargar los clientes.')
    });
  }

  // ======================
  //   LISTADO DE PEDIDOS
  // ======================
  loadAll(): void {
    this.isLoading.set(true);
    this.feedback.set('');
    this.http.get<Order[]>(this.ordersBaseUrl).subscribe({
      next: (orders) => this.orders.set(orders),
      error: () => this.feedback.set('No se pudieron cargar los pedidos.'),
      complete: () => this.isLoading.set(false)
    });
  }

  loadToday(): void {
    this.isLoading.set(true);
    this.feedback.set('');
    this.http.get<Order[]>(`${this.ordersBaseUrl}/today`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.feedback.set('Mostrando pedidos de hoy.');
      },
      error: () =>
        this.feedback.set('No se pudieron cargar los pedidos de hoy.'),
      complete: () => this.isLoading.set(false)
    });
  }

  loadOutside(): void {
    this.isLoading.set(true);
    this.feedback.set('');
    this.http.get<Order[]>(`${this.ordersBaseUrl}/outside`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.feedback.set('Mostrando pedidos fuera de horario.');
      },
      error: () =>
        this.feedback.set('No se pudieron cargar los pedidos fuera de horario.'),
      complete: () => this.isLoading.set(false)
    });
  }

  // ======================
  //   CREAR / EDITAR
  // ======================
  submit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.orderForm.getRawValue();

    const item: OrderItem = {
      idPizza: value.pizzaId!,
      quantity: Number(value.pizzaQuantity ?? 1),
      price: Number(value.pizzaPrice ?? 0)
    };

    const body: Omit<Order, 'idOrder'> = {
      idCustomer: value.idCustomer!,
      date: value.date || '',
      method: value.method!,
      total: Number(value.total ?? 0),
      additionalNotes: value.additionalNotes || '',
      items: [item]
    };

    const request = this.editingId()
      ? this.http.put<Order>(`${this.ordersBaseUrl}/${this.editingId()}`, body)
      : this.http.post<Order>(this.ordersBaseUrl, body);

    request.subscribe({
      next: () => {
        this.feedback.set(
          this.editingId() ? 'Pedido actualizado.' : 'Pedido creado.'
        );
        this.resetForm();
        this.loadAll();
      },
      error: () => this.feedback.set('Error al guardar el pedido.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

  edit(order: Order): void {
    this.editingId.set(order.idOrder);

    const firstItem = order.items?.[0];

    this.orderForm.patchValue({
      idCustomer: order.idCustomer,
      date: order.date,
      method: order.method,
      additionalNotes: order.additionalNotes ?? '',
      pizzaId: firstItem?.idPizza ?? null,
      pizzaQuantity: firstItem?.quantity ?? 1,
      pizzaPrice: firstItem?.price ?? (firstItem?.pizza?.price ?? 0),
      total: order.total
    });
  }

  // ======================
  //   ELIMINAR / LIMPIAR
  // ======================
  delete(id: number): void {
    if (!confirm(`¿Eliminar el pedido #${id}?`)) return;

    this.http.delete<void>(`${this.ordersBaseUrl}/${id}`).subscribe({
      next: () => {
        this.feedback.set('Pedido eliminado.');
        this.loadAll();
      },
      error: () => this.feedback.set('No se pudo eliminar el pedido.')
    });
  }

  clearForm(): void {
    this.resetForm();
    this.feedback.set('');
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.orderForm.reset({
      idCustomer: '',
      date: '',
      method: '',
      additionalNotes: '',
      pizzaId: null,
      pizzaQuantity: 1,
      pizzaPrice: 0,
      total: 0
    });
  }

  trackByOrder = (_: number, order: Order) => order.idOrder;
}
