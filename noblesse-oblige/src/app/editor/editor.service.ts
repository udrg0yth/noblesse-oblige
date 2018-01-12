import { Injectable } from '@angular/core';
import { CustomHttp } from '../generics/generics.interceptor';
import { GenericConstants } from '../generics/generics.constants';
import { Headers, Response } from '@angular/http';
import { EditorStateService } from './editor.state.service';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class EditorService {
	private quillEditor : any;
	private updateArticleState = new Subject<number>();
	updateArticleState$ = this.updateArticleState.asObservable();

	private articleTitleUpdate = new Subject<string>();
	articleTitleUpdate$ = this.articleTitleUpdate.asObservable();

	constructor(private customHttp :CustomHttp,
		private editorStateService: EditorStateService) {
		this.editorStateService.articleStateUpdate$.subscribe(state => {
			this.updateArticleState.next(state);
		});

		this.editorStateService.articleTitleUpdate$.subscribe(title => {
			this.articleTitleUpdate.next(title);
		});
	}

	showEditor() {

	}

	/*disconnectFromCurrentRoom() {

	}

	setQuillEditor(quillEditor: any) {
		this.quillEditor = quillEditor;
	}

	getContents() {
		if(this.quillEditor) {
			return this.quillEditor.getContents();
		}
	}

	setContentsToLeaf(delta :any) {
		this.currentLeaf.content = delta;
	}

	setIsLeaf(isLeaf: boolean) {
		this.updateLeaf.next(isLeaf);
	}

	setArticleState(state: number) {
		this.updateArticleState.next(state);
	}

	createNewArticle() {
		this.updateArticleState.next(1);
		this.currentLeaf.content={};
	}

	setCurrentNode(node :any) {
		this.updateCurrentLeaf.next(node);
		this.currentLeaf = node;
		if(!this.currentLeaf.content) {
			this.updateArticleState.next(0);
		} else {
			this.updateArticleState.next(2);
		}
	}

	editArticle() {
		this.updateArticleState.next(1);
	}

	viewArticle() {
		this.updateArticleState.next(2);
	}*/
}