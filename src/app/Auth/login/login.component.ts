import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { NgxUiLoaderModule, NgxUiLoaderService } from 'ngx-ui-loader';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule, NgxUiLoaderModule,HttpClientModule], // ✅ Fix here (no forRoot)
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage: string = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngxLoader: NgxUiLoaderService // ✅ Injecting loader service
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const loginData = this.loginForm.value;

    // Start loader
    this.ngxLoader.start();

    this.authService
      .login(loginData)
      .then((res: any) => {
        this.loading = false;
        this.ngxLoader.stop(); // Stop loader

        if (res) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = 'Invalid response from server.';
        }
      })
      .catch((error: any) => {
        this.loading = false;
        this.ngxLoader.stop(); // Stop loader
        this.errorMessage = error?.error?.message || 'Login failed. Please try again.';
      });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
