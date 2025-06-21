import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Config } from '../../service/env.config';
import { BehaviorSubject, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  IsLogged_in = false;
  private refreshTokenUrl = `${Config.LoginEndpoint}auth/refresh-token`;
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
  }
   // Get the stored access token
   getAccessToken() {
    return sessionStorage.getItem('accessToken');
  }
  
  // Get the stored refresh token
  getRefreshToken() {
    return sessionStorage.getItem('refreshToken');
  }

  // Store tokens in local storage
  storeTokens(accessToken: string, refreshToken: string) {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
  }

  // Handle refreshing the access token
  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<any>(this.refreshTokenUrl, { refreshToken }).pipe(
      switchMap((data) => {
        this.storeTokens(data.accessToken, data.refreshToken); // Store new tokens
        return data.accessToken; // Return new access token
      })
    );
  }

  login(data: any) {
    return this.http.post(`${Config.LoginEndpoint}auth/login`, data,{headers : {'Content-Type': 'application/json'}})
      .toPromise()
      .then((response: any) => {
        if (response && response.accessToken) {
          sessionStorage.setItem('accessToken', response.accessToken);
          sessionStorage.setItem('refreshToken', response.refreshToken);
          sessionStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
      })
      .catch((error) => Promise.reject(error));
  }
  getOtp(data: any) {
    let email = {
      "email": data
    }
    return this.http.post(`${Config.LoginEndpoint}auth/send-otp`, email,{headers : {'Content-Type': 'application/json'}})
      .toPromise()
      .then((response: any) => {
       
        return response;
      })
      .catch((error) => Promise.reject(error));
  }
  verifyOTP(email:any,otp: any) {
    let body = {
      "email": email,
      "otp": otp
    }
    return this.http.post(`${Config.LoginEndpoint}auth/verify-otp`, body,{headers : {'Content-Type': 'application/json'}})
      .toPromise()
      .then((response: any) => {
       
        return response;
      })
      .catch((error) => Promise.reject(error));
  }
  getAllRoles() {
    const token = sessionStorage.getItem('accessToken'); // Get the token from localStorage
    if (!token) {
      return Promise.reject('No token found'); // Return error if no token exists
    }
  
    return this.http.get(`${Config.LoginEndpoint}auth/getAllRoles`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // Add Authorization header with the token
      }
    })
    .toPromise()
    .then((response: any) => {
      return response;
    })
    .catch((error) => Promise.reject(error));
  }
  
  register(userData: any): Promise<any> {
    return this.http.post(`${Config.LoginEndpoint}auth/register`, userData).toPromise();
  }
  logout() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  getUser(): any {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }




}
