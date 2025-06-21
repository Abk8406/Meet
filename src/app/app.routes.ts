import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddToCartComponent } from './components/add-to-cart/add-to-cart.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CartComponent } from './components/cart/cart.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { ApplicationComponent } from './application/application.component';
import { ExploreComponent } from './explore/explore.component';
import { LoginComponent } from './Auth/login/login.component';
import { AuthGuard } from './Auth/auth.guard';
import { RegisterComponent } from './Auth/registration/registration.component';
import { ScreenSharingComponent } from './components/screen-sharing/screen-sharing.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' } ,// Default route to login
  { path: 'login', component: LoginComponent } ,// Default route to login
  { path: 'register', component: RegisterComponent },
  { path: 'screen-sharing', component: ScreenSharingComponent },
  { path: 'home', component: AddToCartComponent , canActivate: [AuthGuard] },
  { path: 'apps', component:  ApplicationComponent,canActivate: [AuthGuard] },
  { path: 'explore', component:  ExploreComponent,canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent ,canActivate: [AuthGuard]},
  { path: 'product/:id', component: ProductDetailsComponent, canActivate: [AuthGuard]}, // Product details page
  { path: 'profile', component: ProfileComponent ,canActivate: [AuthGuard]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
