import { Component } from '@angular/core';

@Component({
  selector: 'app-application',
  standalone: true,
  templateUrl: './application.component.html',
  styleUrls: ['./application.component.css']
})
export class ApplicationComponent {
  title = 'The Burger Blog!';
  imageSrc = 'assets/burger-chef.jpg'; 
}
