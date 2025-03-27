import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BurgerService } from '../add-to-cart/burger.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule], 
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
  providers: [BurgerService],
})
export class ProductDetailsComponent {
  relatedProducts: any[] = [];


  constructor(private route: ActivatedRoute, private burgerService: BurgerService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (isNaN(id)) {
      console.error('Invalid Product ID');
      return;
    }

    this.burgerService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        console.log('Product Data:', this.product);
      },
      error: (err) => console.error(' Failed to fetch product:', err),
    });

    this.burgerService.getRelatedProducts(id).subscribe({
      next: (data) => {
        this.relatedProducts = data;
        console.log('Related Products:', this.relatedProducts);
      },
      error: (err) => console.error(' Failed to fetch related products:', err),
    });
  }

  product: any;
  quantity: number = 1;
 


  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) this.quantity--;
  }


  
}
