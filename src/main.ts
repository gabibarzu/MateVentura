import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { migrateStorageKeys } from './app/utils/storage-migration';

// Before any service reads its saved data.
migrateStorageKeys();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
