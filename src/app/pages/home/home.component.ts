import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuComponent } from '../../commons/menu/menu.component';

type Highlight = {
  title: string;
  description: string;
};

type Step = {
  title: string;
  detail: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MenuComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  highlights = [
  {
    title: 'Carta digital',
    description:
      'Arma la lista de pizzas, combos, bebidas y extras que ofrece Los Churros, con precios y estado de venta.',
  },
  {
    title: 'Órdenes del día',
    description:
      'Visualiza qué pedidos están entrando, cuáles ya se prepararon y cuáles quedan pendientes de entrega.',
  },
  {
    title: 'Fichas de clientes',
    description:
      'Guarda teléfonos y datos básicos para reconocer rápido a quienes ya compraron antes y atenderlos mejor.',
  },
  {
    title: 'Bandeja de mensajes',
    description:
      'Centraliza consultas sobre reservas, cumpleaños, pedidos corporativos o cualquier comentario del cliente.',
  },
];
}
