import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BurgerService {

  constructor(private http: HttpClient) { }

  getBurgers(): Observable<any> {
    return this.http.get('assets/burgers.json');
  }

  getProductById(id: number): Observable<any> {
    console.log(`🔍 Fetching product ID: ${id}`);
    return this.getBurgers().pipe(
      map((data: any) => {
        const foundItem = data.map((category: any) => category.items).flat().find((item: any) => item.id === id);
        if (!foundItem) throw new Error('Product not found');
        return foundItem;
      }),
      catchError((error) => {
        console.error(' Error fetching product:', error.message, error);
        return throwError(() => new Error('Failed to fetch product details'));
      })
    );
  }

  getRelatedProducts(id: number): Observable<any[]> {
    return this.http.get<any[]>('assets/related.json').pipe(
      map((products: any[]) => {
        console.log(' All Products:', products);
        return products.filter(product => product.id !== id);
      }),
      catchError((error) => {
        console.error(' Error fetching related products:', error);
        return throwError(() => new Error('Failed to fetch related products'));
      })
    );
  }

}
