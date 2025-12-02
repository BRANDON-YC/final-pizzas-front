import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PizzasComponent } from './pages/cellphones/cellphones.component';
import { ContactComponent } from './pages/contact/contact.component';
import { OrdersComponent } from './pages/chargers/chargers.component';
import { CustomersComponent } from './pages/customers/customers.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Páginas conectadas al backend
  { path: 'pizzas', component: PizzasComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'contact', component: ContactComponent },

  // Alias por si tenías rutas viejas
  { path: 'celulares', redirectTo: 'pizzas', pathMatch: 'full' },
  { path: 'cargadores', redirectTo: 'orders', pathMatch: 'full' },

  { path: '**', redirectTo: '' }
];
