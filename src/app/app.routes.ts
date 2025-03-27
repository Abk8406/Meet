import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddToCartComponent } from './components/add-to-cart/add-to-cart.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CartComponent } from './components/cart/cart.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { ApplicationComponent } from './application/application.component';
import { ExploreComponent } from './explore/explore.component';

export const routes: Routes = [
  { path: 'home', component: AddToCartComponent },
  { path: 'apps', component:  ApplicationComponent },
  { path: 'explore', component:  ExploreComponent },
  { path: 'cart', component: CartComponent },
  { path: 'product/:id', component: ProductDetailsComponent }, // Product details page
  { path: 'profile', component: ProfileComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' } // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
