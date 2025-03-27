import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search',
  standalone: true
})
export class SearchPipe implements PipeTransform {
  transform(categories: any[], searchText: string): any[] {
    if (!categories || !searchText) {
      return categories;
    }
    searchText = searchText.toLowerCase();
    
    return categories.map(category => ({
      ...category,
      items: category.items.filter((burger: any) =>
        burger.name.toLowerCase().includes(searchText)
      )
    })).filter(category => category.items.length > 0); // Remove empty categories
  }
}
