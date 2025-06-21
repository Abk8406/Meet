import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  standalone: true,
  imports: [RouterOutlet, CommonModule,HttpClientModule] 
})
export class CartComponent implements OnInit {
  cart: any[] = [];
  discount: number = 56; 

  constructor(private router: Router) {}

  ngOnInit() {
    const savedCart = localStorage.getItem('cart');
    this.cart = savedCart ? JSON.parse(savedCart) : [];
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.updateCart();
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeFromCart(item.id);
    }
    this.updateCart();
  }

  removeFromCart(id: number) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.updateCart();
  }

  getTotal() {
    let total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.cart.length > 0 ? total - this.discount : total;
  }

  checkout() {
    if (this.cart.length === 0) {
      alert("🛒 Your cart is empty!");
      return;
    }

    const orderDetails = {
      items: this.cart,
      subtotal: this.getTotal() + this.discount,
      discount: this.discount,
      total: this.getTotal()
    };

    console.log("Order Details:", JSON.stringify(orderDetails, null, 2));

    alert("Order placed successfully!");
    localStorage.removeItem('cart');
    this.cart = [];
    this.router.navigate(['/']);
  }

  updateCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
}
