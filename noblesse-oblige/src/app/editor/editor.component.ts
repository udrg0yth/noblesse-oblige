import { Component, ViewChild } from '@angular/core';
import { EditorConstants } from './editor.constants';
import { EditorService } from './editor.service';

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

	constructor(private editorService: EditorService) {
		 editorService.updateArticleState$.subscribe(state => {
	       this.articleState = state;
	     });
	}

	setQuillEditor(event) {
		this.quillEditor = event;
		/*this.quillEditor.setContents(this.currentLeaf.content);
		if(this.articleState === 1) {
			this.quillEditor.enable();
		}
		if(this.articleState === 2) {
			this.quillEditor.disable();
		}
		console.log('quill');
		this.editorService.setQuillEditor(this.quillEditor);*/
	}

	/*onContentChanged(delta : any) {
		this.editorService.setContentsToLeaf(this.quillEditor.getContents());
	}

	createNewArticle() {
		this.editorService.createNewArticle();
	}

	editArticle() {
		this.quillEditor.enable();
		this.editorService.editArticle();
	}

	viewArticle() {
		this.quillEditor.disable();
		this.editorService.viewArticle();
	}*/

}