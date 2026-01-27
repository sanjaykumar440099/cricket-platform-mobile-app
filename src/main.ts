import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { refreshInterceptor } from './app/core/interceptors/refresh.interceptor';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  personOutline,
  calendarOutline,
  radioOutline,
  trophyOutline,
} from 'ionicons/icons';

/* REGISTER ICONS */
addIcons({
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'calendar-outline': calendarOutline,
  'radio-outline': radioOutline,
  'trophy-outline': trophyOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        refreshInterceptor
      ])
    )
  ]
});
