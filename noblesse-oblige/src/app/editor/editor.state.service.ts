import { Injectable } from '@angular/core';
import { EditorState } from './editor.state';
import { GenericConstants } from '../generics/generics.constants';
import { Response } from '@angular/http';
import { EditorConstants } from './editor.constants';
import { CollaborationService } from '../collaboration/collaboration.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { Observable, Subject } from 'rxjs/Rx';
import { CustomHttp } from '../generics/generics.interceptor';
import { RoomUsers } from '../models/room-users';
import { QuillStateService } from './editor.quill.state.service';

@Injectable()
export class EditorStateService {
	private nodeId : string;
	private articleTitle : string;
	private articleState : number;
	private roomId : string;
	private roomUsers : RoomUsers = new RoomUsers();
	private quillEditor : any;

	private articleTitleUpdate = new Subject<string>();
	articleTitleUpdate$ = this.articleTitleUpdate.asObservable();

	private articleStateUpdate = new Subject<any>();
	articleStateUpdate$ = this.articleStateUpdate.asObservable();

	private roomUsersUpdate = new Subject<RoomUsers>();
	roomUsersUpdate$ = this.roomUsersUpdate.asObservable();

	private waitOnArticleChangeUpdate = new Subject<boolean>();
	waitOnArticleChangeUpdate$ = this.waitOnArticleChangeUpdate.asObservable();

	private noobArticleSyncRequest = new Subject<any>();
	noobArticleSyncRequest$ = this.noobArticleSyncRequest.asObservable();

	constructor(private collaborationService : CollaborationService,
		private authenticationService : AuthenticationService,
		private customHttp: CustomHttp,
		private quillStateService : QuillStateService) {
		this.collaborationService.updateArticleRoomUsers$.subscribe(data => {
			if(data.add) {
				this.roomUsers.addUser(data.user);
			} else {
				this.roomUsers.removeUser(data.user);
			}
			this.roomUsersUpdate.next(this.roomUsers);
		});

		this.authenticationService.onLogout$.subscribe(logout => {
			this.roomUsers = new RoomUsers();
			this.roomUsersUpdate.next(this.roomUsers);
		});

		this.collaborationService.connectedToArticleRoom$.subscribe(connected => {
			this.waitOnArticleChangeUpdate.next(false);
		});

		this.collaborationService.updateArticleMaster$.subscribe(isMaster => {
			console.log('master', isMaster);
			if(isMaster) {
				this.quillStateService.updateArticleContentFromDatabase(this.nodeId);
			} else {
				this.quillStateService.setNodeId(this.nodeId);
			}
		});

		this.collaborationService.disconectedFromArticleRoom$.subscribe(event => {
			this.roomUsers = new RoomUsers();
			this.roomUsersUpdate.next(this.roomUsers);
		});

		this.quillStateService.cursorUpdate$.subscribe(data => {
			let cursors = this.quillEditor.getModule('cursors');
			console.log(this.roomUsers, data);
		 	let cursorConfig = this.roomUsers.findByName(data.source).cursorConfig;
    		cursors.setCursor(cursorConfig.id, data.range, cursorConfig.name, cursorConfig.color);
		});
	}

	//asume previous article was cleared
	changeArticle(node :any) {
		this.waitOnArticleChangeUpdate.next(true);
		this.cleanPreviousState();
		if((node.data && node.hasChildren) ||
		   (node.data && !node.data.parentId) || 
		   (!node.data && !node.parentId)) {
			this.articleState = EditorState.NULL;
			this.articleStateUpdate.next(this.articleState);
			this.waitOnArticleChangeUpdate.next(false);
		} else {
			let nodeInfo = node.data || node;
			this.articleTitle = nodeInfo.name;
			this.nodeId = nodeInfo._id;
			console.log(this.nodeId);
			this.getArticleForNode(nodeInfo._id).subscribe(data => {
				this.roomId = data.roomId;
				if(data.creationDate) {
					this.articleState = EditorState.VIEW;
					this.waitOnArticleChangeUpdate.next(false);
					this.quillStateService.updateArticleContentFromDatabase(this.nodeId);
					this.setArticleState(2);
				} else {
					this.articleState = EditorState.NEW;
					this.waitOnArticleChangeUpdate.next(false);
				}
				this.articleStateUpdate.next(this.articleState);
			}, error => {});
		}
		this.articleTitleUpdate.next(this.articleTitle);
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
		return this.customHttp
        .post(`${GenericConstants.BASE_URL}${EditorConstants.GET_ARTICLE}`, {_id : id})
        .map((response :Response) => {
        	return response.json() || {};
        })
        .catch((error :Response | any) => {
			return Observable.throw(error);
        });
	}

	createNewArticle() {
		this.disconnectFromArticleRoom();
		this.clearRoomUsers();
		this.customHttp
		.post(`${GenericConstants.BASE_URL}${EditorConstants.CREATE_ARTICLE}`, {_id : this.nodeId})
		.map((response :Response) => {
        	return response.json() || {};
        })
        .catch((error :Response | any) => {
			return Observable.throw(error);
        })
        .subscribe(data => {
        	this.roomId = data.roomId;
        	this.articleState = EditorState.EDIT;
			this.articleStateUpdate.next(this.articleState);
			this.collaborationService.connectToArticleRoom(this.authenticationService.getClaims(), this.roomId);
        }, error => {})
		//create new
			//update state
			//connect to article room
	}

	private cleanPreviousState() {
		this.clearRoomUsers();
		this.disconnectFromArticleRoom();
		this.quillEditor.setContents({}, 'initial');
		this.articleState = null;
		this.roomId = null;
		this.articleTitle = null;
	}

	private clearRoomUsers() {
		this.roomUsers = new RoomUsers();
		this.roomUsersUpdate.next(this.roomUsers);
	}

	setArticleState(state : number) {
		this.articleState = state;
		if(state === 3) {
			this.waitOnArticleChangeUpdate.next(true);
			this.quillStateService.setArticleState(3);
			this.collaborationService.connectToArticleRoom(this.authenticationService.getClaims(), this.roomId);
		} else if(state == 2) {
			this.clearRoomUsers();
			this.disconnectFromArticleRoom();
			this.quillStateService.setArticleState(2);
		}
		this.articleStateUpdate.next(state);
	}

	getNodeId() {
		return this.nodeId;
	}

	setQuillEditor(quillEditor : any) {
		this.quillEditor = quillEditor;
		this.quillStateService.setQuillEditor(quillEditor);
	}

	onContentChanged(delta : any) {
		this.quillStateService.onContentChanged(delta);
	}

	emitDelta(delta : any, range: any, source :string) {
		this.collaborationService.emitDelta({
			delta: delta,
			range: range,
			source: source,
			timestamp: Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}))
		});
	}

	setArticleStateUpdate() {
		this.quillStateService.setArticleStateUpdate(this.articleStateUpdate$);
	}
}