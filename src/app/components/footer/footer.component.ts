import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  activeTab: string = 'home';

  constructor(private router: Router) {}

  openTab(tabName: string) {
    this.activeTab = tabName;
    this.router.navigate([`/${tabName}`]);
  }
}
