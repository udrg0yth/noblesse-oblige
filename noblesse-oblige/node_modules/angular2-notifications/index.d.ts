import { ModuleWithProviders } from '@angular/core';
export * from './components/notification/notification.component';
export * from './components/simple-notifications/simple-notifications.component';
export * from './services/notifications.service';
export * from './interfaces/icons';
export * from './interfaces/notification-event.type';
export * from './interfaces/notification.type';
export * from './interfaces/options.type';
export declare class SimpleNotificationsModule {
    static forRoot(): ModuleWithProviders;
}
