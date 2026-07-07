import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

initializeApp({
  projectId: "demo-mapa-avila",
  apiKey: "fake-api-key"
});

const funcionesFirebase = getFunctions(undefined, 'europe-west1');
connectFunctionsEmulator(funcionesFirebase, "127.0.0.1", 5001);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
