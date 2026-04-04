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
  analyticsOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  compassOutline,
  contrastOutline,
  peopleOutline,
  personOutline,
  calendarOutline,
  homeOutline,
  locationOutline,
  logInOutline,
  playCircleOutline,
  radioOutline,
  shareOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  timeOutline,
  trophyOutline,
  trendingUpOutline,

  createOutline,
  trashOutline,
  addCircleOutline,
  closeOutline,
  chevronForwardOutline,
  gridOutline,
  flashOutline,
} from 'ionicons/icons';

/* REGISTER ICONS */
addIcons({
  'analytics-outline': analyticsOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'compass-outline': compassOutline,
  'contrast-outline': contrastOutline,
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'calendar-outline': calendarOutline,
  'home-outline': homeOutline,
  'location-outline': locationOutline,
  'log-in-outline': logInOutline,
  'play-circle-outline': playCircleOutline,
  'radio-outline': radioOutline,
  'share-outline': shareOutline,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'sparkles-outline': sparklesOutline,
  'time-outline': timeOutline,
  'trophy-outline': trophyOutline,
  'trending-up-outline': trendingUpOutline,
  'create-outline': createOutline,
  'trash-outline': trashOutline,
  'add-circle-outline': addCircleOutline,
  'close-outline': closeOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'grid-outline': gridOutline,
  'flash-outline': flashOutline,
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
