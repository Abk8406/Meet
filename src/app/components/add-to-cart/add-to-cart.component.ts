import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BurgerService } from './burger.service';
import { Router, RouterOutlet } from '@angular/router';
import { SearchPipe } from './search.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [CommonModule, RouterOutlet,SearchPipe,FormsModule],
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.css'],
  providers: [BurgerService]
})
export class AddToCartComponent {
  categories: any[] = [];
  searchText: string = '';
  constructor(private burgerService: BurgerService, private router: Router) { }

  ngOnInit() {
    this.burgerService.getBurgers().subscribe((data) => {
      this.categories = data;
    });
  }

  goToDetails(productId: number) {
    this.router.navigate(['/product', productId]);
  }
  addToCart(burger: any) {
    let existingItem = this.cart.find(item => item.id === burger.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({ ...burger, quantity: 1 });
    }
  }
  cart: any[] = [];
  increaseQuantity(burger: any) {
    let item = this.cart.find(item => item.id === burger.id);
    if (item) {
      item.quantity++;
    } else {
      this.addToCart(burger);
    }
  }

  decreaseQuantity(burger: any) {
    let itemIndex = this.cart.findIndex(item => item.id === burger.id);
    if (itemIndex !== -1) {
      if (this.cart[itemIndex].quantity > 1) {
        this.cart[itemIndex].quantity--;
      } else {
        this.cart.splice(itemIndex, 1);
      }
    }
  }

  getQuantity(id: number) {
    let item = this.cart.find(item => item.id === id);
    return item ? item.quantity : 0;
  }

  goToCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.router.navigate(['/cart']);
  }

}
