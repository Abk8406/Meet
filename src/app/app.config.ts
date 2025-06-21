import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './Auth/auth.service';
import { loaderConfig } from './explore/loader';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { AuthInterceptor } from './Auth/global.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(), // ✅ Fixed: using correct Angular function
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(NgxUiLoaderModule.forRoot(loaderConfig)),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    AuthService
  ]
};


