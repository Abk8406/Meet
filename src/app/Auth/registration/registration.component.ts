import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouteConfigLoadEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { NgOtpInputComponent } from 'ng-otp-input';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule,NgOtpInputComponent],
})
export class RegisterComponent {

  registerForm: FormGroup;
  loading = false;
  verifySuccess = false;
  errorMessage: string = '';
  isEmailValid: boolean = false;
  otpSent: boolean = false;
  resendCooldown: number = 0;
  otpResentMessage: string = '';
  private cooldownInterval: any;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role_id : ['', Validators.required],
      otp : ['']
    });
  }
  checkEmailValidity() {
    this.isEmailValid = this.registerForm.controls['email'].valid;
  }
  getOTP() {
    const email = this.registerForm.controls['email'].value;
    this.authService.getOtp(email).then(() => {
      this.otpSent = true;
      this.startResendCooldown();
      this.otpResentMessage = '';
      // Simulate API call (Replace with actual API call)
      console.log("Requesting OTP for:", email);

      // Assume API call succeeds
      setTimeout(() => {
        this.otpSent = true;
        console.log("OTP sent successfully");
      }, 1000);
    })
  }

  resendOTP() {
    if (this.resendCooldown > 0) return;
    const email = this.registerForm.controls['email'].value;
    this.authService.getOtp(email).then(() => {
      this.otpResentMessage = 'OTP resent successfully!';
      this.startResendCooldown();
      setTimeout(() => {
        this.otpResentMessage = '';
      }, 3000);
      // Simulate API call (Replace with actual API call)
      console.log("Resending OTP for:", email);
    });
  }

  startResendCooldown() {
    this.resendCooldown = 30;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  onOtpChange($event: string) {
    if($event.length === 6) {
       this.registerForm.controls['otp'].setValue($event);
      this.authService.verifyOTP(this.registerForm.controls['email'].value,$event).then((data) => {
        // Simulate API call (Replace with actual API call)
        console.log("Verifying OTP:", data);
        this.verifySuccess = true;

        // Assume API call succeeds
        setTimeout(() => {
          this.otpSent = true;
          console.log("OTP verified successfully");
        }, 1000);
      }).catch((error) => {
        this.verifySuccess = false;
        console.log("Error verifying OTP:", error);
      });
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    
    const userData = this.registerForm.value;
    userData.role_id = parseInt(userData.role_id);
    this.authService.register(userData)
      .then(() => {
        this.loading = false;
        alert('Registration successful! Please log in.');
        this.router.navigate(['/login']); // Navigate to login page
      })
      .catch((error: any) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Registration failed. Please try again.';
      });
  }
  navigateTologin() {
    this.router.navigate(['/login']);
  }
}
