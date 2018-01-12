import { Injectable } from '@angular/core';
import { EditorState } from './editor.state';
import { CollaborationService } from '../collaboration/collaboration.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class EditorStateService {
	private articleTitle : string;
	private articleState : number;
	private roomId : string;

	private articleTitleUpdate = new Subject<string>();
	articleTitleUpdate$ = this.articleTitleUpdate.asObservable();

	private articleStateUpdate = new Subject<any>();
	articleStateUpdate$ = this.articleStateUpdate.asObservable();

	constructor(private collaborationService : CollaborationService,
		private authenticationService : AuthenticationService) {

	}

	//asume previous article was cleared
	changeArticle(node :any) {
		this.cleanPreviousState();
		if(!node.hasChildren) {
			this.articleState = EditorState.NULL;
		} else {
			this.articleTitle = node.data.name;
			this.getArticleForNode(node._id);
			//get article for node
			//is new, created?
			//update state
			//if state is new show creation
			//if not join article room
		}
		//push state
	}

	private connectToRoom(roomId) {
		this.roomId = roomId;
		this.collaborationService.connectToArticleRoom(this.authenticationService.getClaims(), this.roomId);
	}

	private disconnectFromArticleRoom() {
		this.collaborationService.disconnectFromArticleRoom();
	}

	private getArticleForNode(id : string) {
		console.log('node id', id);
	}

	private cleanPreviousState() {
		this.disconnectFromArticleRoom();
		this.roomId = null;
		this.articleTitle = null;
	}

	createNewArticle() {

	}
}