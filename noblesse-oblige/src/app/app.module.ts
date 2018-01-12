import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule, XHRBackend, RequestOptions } from '@angular/http';

import { AppComponent } from './app.component';
import { ArticleTreeComponent } from './article-tree/article-tree.component';

import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { TreeModule } from 'angular-tree-component';
import { ContextMenuModule } from 'ngx-contextmenu';
import { QuillModule } from 'ngx-quill';
import { CustomHttp } from './generics/generics.interceptor';
import { ArticleTreeService } from './article-tree/article-tree.service';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ArtricleTreeNewDialogComponent } from './article-tree/article-tree-new-dialog/article-tree-new-dialog.component';
import { ArticleTreeDeleteDialogComponent } from './article-tree/article-tree-delete-dialog/article-tree-delete-dialog.component';
import { MatDialogModule, MatTooltipModule, MatIconModule } from '@angular/material';
import { EditorComponent } from './editor/editor.component';
import { EditorService } from './editor/editor.service';
import { AuthenticationComponent } from './authentication/authentication.component';
import { DocumentsComponent } from './documents/documents.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationService } from './authentication/authentication.service';
import { ArticleTreeDbUpdateService } from './article-tree/article-tree.dbupdate.service';
import { CollaborationService } from './collaboration/collaboration.service';
import { NotificationComponent } from './notification/notification.component';
import { MatButtonModule } from '@angular/material/button';
import { EditorStateService } from './editor/editor.state.service';

export function customHttpFactory(backend: XHRBackend, defaultOptions: RequestOptions) { return new CustomHttp(backend, defaultOptions); }

const appRoutes: Routes = [
  {
    path: 'login',
    component: AuthenticationComponent
  },
  {
    path: 'documents',
    component: DocumentsComponent
  },
  { 
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    ArticleTreeComponent,
    ArtricleTreeNewDialogComponent,
    ArticleTreeDeleteDialogComponent,
    EditorComponent,
    AuthenticationComponent,
    DocumentsComponent,
    NotificationComponent
  ],
  entryComponents: [
    ArtricleTreeNewDialogComponent,
    ArticleTreeDeleteDialogComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgbModule.forRoot(),
    TreeModule,
    MatDialogModule,
    ContextMenuModule.forRoot(),
    QuillModule,
    SimpleNotificationsModule.forRoot(),
    RouterModule.forRoot(appRoutes),
    MatTooltipModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [{
      provide: CustomHttp,
      useFactory: customHttpFactory,
      deps: [XHRBackend, RequestOptions]
  },
  ArticleTreeService,
  EditorService,
  AuthenticationService,
  CollaborationService,
  ArticleTreeDbUpdateService,
  EditorStateService],
  bootstrap: [AppComponent]
})
export class AppModule { }
