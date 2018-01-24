import { Component, ViewChild, NgZone, ElementRef } from '@angular/core';
import { EditorConstants } from './editor.constants';
import { EditorService } from './editor.service';
import { EditorState } from './editor.state';
import { RoomUsers } from '../models/room-users';
import { AuthenticationService } from '../authentication/authentication.service';

import * as Quill from 'quill/dist/quill';
import * as QuillCursors from 'quill-cursors/src/cursors';

const Parchment = Quill.import('parchment');
let Block = Parchment.query('block');

Block.tagName = 'DIV';
Quill.register(Block, true);
Quill.register('modules/cursors', QuillCursors.default);


@Component({
  selector: 'editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent {
	private quillEditor : any;
	@ViewChild("quillElement")
	private quillElement : any;

	articleTitle : string = 'Undefined';
	articleState : number = 0;
	quillModules : any = EditorConstants.CONFIGURATION_EDIT;
	waitOnArticleChange : boolean = false;
	roomUsers :RoomUsers = new RoomUsers();

	public notificationOptions = {
	    position: ["bottom", "left"],
	    timeOut: 2000,
	    lastOnBottom: true,
	    showProgressBar: true,
	    pauseOnHover: false,
	    clickToClose: false,
	    maxLength: 10
	};

	constructor(private editorService: EditorService, private zoneService : NgZone, private elRef:ElementRef, private authenticationService: AuthenticationService) {
		console.log(QuillCursors, window);
		 this.editorService.updateArticleState$.subscribe(state => {
		 	this.zoneService.run(() => {
	         this.articleState = state;
		 	 if(state === EditorState.EDIT && this.quillEditor) {
		 	 	this.unhideQuillToolbar();
				this.quillEditor.enable();
			 }

			 if(state === EditorState.VIEW && this.quillEditor) {
		 	 	this.hideQuillToolbar();
				this.quillEditor.disable();
			 }
		 	});
	     });
	     this.editorService.articleTitleUpdate$.subscribe(title => {
		 	this.zoneService.run(() => {
	     		this.articleTitle = title;
	     	});
	     });

	     this.editorService.roomUsersUpdate$.subscribe(roomUsers => {
	     	this.zoneService.run(() => {
	     		this.roomUsers = roomUsers;
	     	});
	     });

	     this.editorService.waitOnArticleChangeUpdate$.subscribe(wait =>{
	     	this.zoneService.run(() => {
	     		this.waitOnArticleChange = wait;
	     	});
	     });
	}

	setQuillEditor(event) {
		this.quillEditor = event;
		this.editorService.setQuillEditor(this.quillEditor);
	}

	onContentChanged(event : any) {
		console.log(event);
		let nameOfCurrentUser = this.authenticationService.getClaims().name;
		console.log(event.source, nameOfCurrentUser);
		if(event.source === 'user') {
			let range = this.quillEditor.getSelection();
			console.log(range);
			this.editorService.emitDelta(event.delta, range, nameOfCurrentUser);
		}
		if(event.source !== 'initial') {
			this.editorService.onContentChanged(event);
		}
	}

	selectionChanged(event) {
		 if (event.range) {
			let cursors = this.quillEditor.getModule('cursors');
		 	let cursorConfig = this.authenticationService.getClaims().cursorConfig;
    		cursors.setCursor(cursorConfig.id, event.range, cursorConfig.name, cursorConfig.color);
    	}
	}

	createNewArticle() {
		this.editorService.createNewArticle();
	}

	editArticle() {
		this.editorService.setArticleState(EditorState.EDIT);
	}

	viewArticle() {
		this.editorService.setArticleState(EditorState.VIEW);
	}

	private unhideQuillToolbar() {
		let nativeEl = this.elRef.nativeElement.querySelector('.ql-toolbar');
		nativeEl.classList.remove('hide-toolbar');
		nativeEl.classList.add('unhide-toolbar');
	}

	private hideQuillToolbar() {
		let nativeEl = this.elRef.nativeElement.querySelector('.ql-toolbar');
		nativeEl.classList.remove('unhide-toolbar');
		nativeEl.classList.add('hide-toolbar');
	}

}