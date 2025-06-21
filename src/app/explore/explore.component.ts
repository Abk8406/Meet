import { Component } from '@angular/core';

@Component({
  selector: 'app-explore',
  standalone: true,
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent {
  title = 'Explore Page';
  description = 'This is a static explore component for demonstration purposes.';
}
