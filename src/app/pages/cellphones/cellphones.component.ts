import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuComponent } from '../../commons/menu/menu.component';

type Pizza = {
  idPizza: number | null;
  name: string;
  description: string;
  price: number;
  vegetarian: boolean;
  vegan: boolean;
  available: boolean;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

@Component({
  selector: 'app-pizzas',
  standalone: true,
  imports: [CommonModule, MenuComponent, ReactiveFormsModule],
  templateUrl: './cellphones.component.html',
  styleUrl: './cellphones.component.css'
})
export class PizzasComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly baseUrl = 'https://perpetual-gentleness-production.up.railway.app/api/pizzas';


  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly feedback = signal('');
  readonly pizzas = signal<Pizza[]>([]);
  readonly editingId = signal<number | null>(null);

  readonly pizzaForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    vegetarian: [false],
    vegan: [false],
    available: [true]
  });

  constructor() {
    this.loadAll();
  }

  // GET /api/pizzas?page=&elements=
  loadAll(page = 0, elements = 20): void {
    this.isLoading.set(true);
    this.feedback.set('');
    this.http
      .get<Page<Pizza>>(`${this.baseUrl}?page=${page}&elements=${elements}`)
      .subscribe({
        next: (pageData) => this.pizzas.set(pageData?.content ?? []),
        error: () => this.feedback.set('No se pudo obtener el listado de pizzas.'),
        complete: () => this.isLoading.set(false)
      });
  }

  // GET /api/pizzas/available
  loadAvailable(): void {
    this.isLoading.set(true);
    this.feedback.set('');
    this.http
      .get<Page<Pizza>>(
        `${this.baseUrl}/available?page=0&elements=20&sortBy=price&sortDirection=ASC`
      )
      .subscribe({
        next: (pageData) => this.pizzas.set(pageData?.content ?? []),
        error: () => this.feedback.set('No se pudo obtener las pizzas disponibles.'),
        complete: () => this.isLoading.set(false)
      });
  }

  // GET /api/pizzas/name/{name}
  searchByName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    this.isLoading.set(true);
    this.feedback.set('');
    this.http.get<Pizza>(`${this.baseUrl}/name/${encodeURIComponent(trimmed)}`).subscribe({
      next: (pizza) => {
        this.pizzas.set(pizza ? [pizza] : []);
        if (!pizza) {
          this.feedback.set('No se encontró pizza con ese nombre.');
        }
      },
      error: () => {
        this.pizzas.set([]);
        this.feedback.set('Error buscando pizza por nombre.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  // GET /api/pizzas/with/{ingredient}
  searchWithIngredient(ingredient: string): void {
    const trimmed = ingredient.trim();
    if (!trimmed) {
      return;
    }

    this.isLoading.set(true);
    this.feedback.set('');
    this.http
      .get<Pizza[]>(`${this.baseUrl}/with/${encodeURIComponent(trimmed)}`)
      .subscribe({
        next: (data) => this.pizzas.set(data ?? []),
        error: () => {
          this.pizzas.set([]);
          this.feedback.set('Error buscando pizzas con ese ingrediente.');
        },
        complete: () => this.isLoading.set(false)
      });
  }

  // GET /api/pizzas/without/{ingredient}
  searchWithoutIngredient(ingredient: string): void {
    const trimmed = ingredient.trim();
    if (!trimmed) {
      return;
    }

    this.isLoading.set(true);
    this.feedback.set('');
    this.http
      .get<Pizza[]>(`${this.baseUrl}/without/${encodeURIComponent(trimmed)}`)
      .subscribe({
        next: (data) => this.pizzas.set(data ?? []),
        error: () => {
          this.pizzas.set([]);
          this.feedback.set('Error buscando pizzas sin ese ingrediente.');
        },
        complete: () => this.isLoading.set(false)
      });
  }

  // GET /api/pizzas/cheapest/{price}
  searchCheapest(maxPriceRaw: string | number): void {
    const value =
      typeof maxPriceRaw === 'number'
        ? maxPriceRaw
        : Number((maxPriceRaw ?? '').toString().trim());

    if (Number.isNaN(value) || value < 0) {
      this.feedback.set('Precio máximo inválido.');
      return;
    }

    this.isLoading.set(true);
    this.feedback.set('');
    this.http.get<Pizza[]>(`${this.baseUrl}/cheapest/${value}`).subscribe({
      next: (data) => this.pizzas.set(data ?? []),
      error: () => {
        this.pizzas.set([]);
        this.feedback.set('Error buscando pizzas por precio.');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  // POST /api/pizzas  y  PUT /api/pizzas
  submitPizza(): void {
    if (this.pizzaForm.invalid) {
      this.pizzaForm.markAllAsTouched();
      return;
    }

    const formValue = this.pizzaForm.getRawValue();

    const payload: Pizza = {
      idPizza: this.editingId(),
      name: formValue.name,
      description: formValue.description,
      price: Number(formValue.price),
      vegetarian: !!formValue.vegetarian,
      vegan: !!formValue.vegan,
      available: !!formValue.available
    };

    this.isSubmitting.set(true);
    this.feedback.set('');

    const request = this.editingId()
      ? this.http.put<Pizza>(this.baseUrl, payload)
      : this.http.post<Pizza>(this.baseUrl, payload);

    request.subscribe({
      next: () => {
        this.feedback.set(this.editingId() ? 'Pizza actualizada.' : 'Pizza creada.');
        this.resetForm();
        this.loadAll();
      },
      error: () => this.feedback.set('No se pudo guardar la pizza.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

  editPizza(pizza: Pizza): void {
    this.editingId.set(pizza.idPizza ?? null);
    this.pizzaForm.patchValue({
      name: pizza.name,
      description: pizza.description,
      price: pizza.price,
      vegetarian: pizza.vegetarian,
      vegan: pizza.vegan,
      available: pizza.available
    });
  }

  // DELETE /api/pizzas/{idPizza}
  deletePizza(idPizza: number): void {
    if (!confirm('¿Eliminar esta pizza?')) {
      return;
    }

    this.isSubmitting.set(true);
    this.feedback.set('');
    this.http.delete(`${this.baseUrl}/${idPizza}`, { responseType: 'text' as const }).subscribe({
      next: () => {
        this.feedback.set('Pizza eliminada.');
        this.loadAll();
      },
      error: () => this.feedback.set('No se pudo eliminar la pizza.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

  // PUT /api/pizzas/price  (UpdatePizzaPriceDto)
  updatePricePrompt(pizza: Pizza): void {
    if (!pizza.idPizza) {
      return;
    }

    const value = window.prompt(
      `Nuevo precio para "${pizza.name}"`,
      pizza.price.toString()
    );

    if (value == null) {
      return;
    }

    const newPrice = Number(value);
    if (Number.isNaN(newPrice) || newPrice < 0) {
      alert('Precio inválido.');
      return;
    }

    this.updatePrice(pizza.idPizza, newPrice);
  }

  private updatePrice(pizzaId: number, newPrice: number): void {
    this.isSubmitting.set(true);
    this.feedback.set('');

    const dto = { pizzaId, newPrice };

    this.http.put<void>(`${this.baseUrl}/price`, dto).subscribe({
      next: () => {
        this.feedback.set('Precio actualizado.');
        this.loadAll();
      },
      error: () => this.feedback.set('No se pudo actualizar el precio.'),
      complete: () => this.isSubmitting.set(false)
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.pizzaForm.reset({
      name: '',
      description: '',
      price: 0,
      vegetarian: false,
      vegan: false,
      available: true
    });
  }
}
