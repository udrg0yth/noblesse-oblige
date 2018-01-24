import { Injectable } from '@angular/core';
import { CollaborationConstants } from './collaboration.constants'; 
import { User } from '../models/user';
import { RoomUsers } from '../models/room-users';
import { Subject } from 'rxjs/Subject';
import { OnDestroy } from '@angular/core';
import { AuthenticationService } from '../authentication/authentication.service';

import * as io from 'socket.io-client'; 

@Injectable()
export class CollaborationService implements OnDestroy{
	private globalSocket;
	private articleSocket;

	private globalMaster :boolean = false;
	private articleMaster :boolean = false;

	private updateGlobalRoomUsers = new Subject<any>();
	updateGlobalRoomUsers$ = this.updateGlobalRoomUsers.asObservable();

	private updateGlobalMaster = new Subject<boolean>();
	updateGlobalMaster$ = this.updateGlobalMaster.asObservable();

	private updateArticleRoomUsers = new Subject<any>();
	updateArticleRoomUsers$ = this.updateArticleRoomUsers.asObservable();

	private updateArticleMaster = new Subject<boolean>();
	updateArticleMaster$ = this.updateArticleMaster.asObservable();

	private nodeDeletion = new Subject<any>();
	nodeDeletion$ = this.nodeDeletion.asObservable();

	private nodeCreation = new Subject<any>();
	nodeCreation$ = this.nodeCreation.asObservable();

	private nodeUpdated = new Subject<any>();
	nodeUpdated$ = this.nodeUpdated.asObservable();

	private nodeMoved = new Subject<any>();
	nodeMoved$ = this.nodeMoved.asObservable();

	private noobNodeSyncRequest = new Subject<any>();
	noobNodeSyncRequest$ = this.noobNodeSyncRequest.asObservable();

	private nodeSync = new Subject<any>();
	nodeSync$ = this.nodeSync.asObservable();

	private connectedToGlobal = new Subject<any>();
	connectedToGlobal$ = this.connectedToGlobal.asObservable();

	private connectedToArticleRoom = new Subject<any>();
	connectedToArticleRoom$ = this.connectedToArticleRoom.asObservable();

	private disconectedFromArticleRoom = new Subject<boolean>();
	disconectedFromArticleRoom$ = this.disconectedFromArticleRoom.asObservable();

	private disconectedFromGlobalRoom = new Subject<boolean>();
	disconectedFromGlobalRoom$ = this.disconectedFromGlobalRoom.asObservable();

	private noobArticleSyncRequest = new Subject<any>();
	noobArticleSyncRequest$ = this.noobArticleSyncRequest.asObservable();

	private articleSyncUpdate = new Subject<any>();
	articleSyncUpdate$ = this.articleSyncUpdate.asObservable();

	private remoteDelta = new Subject<any>();
	remoteDelta$ = this.remoteDelta.asObservable();


	constructor(private authenticationService : AuthenticationService) {
		authenticationService.onLogout$.subscribe(logout => {
			this.closeSockets();
		});
	}

	ngOnDestroy() {
		this.closeSockets();
	}

	private closeSockets() {
		if(this.globalSocket && this.globalSocket.connected) {

	    		this.globalSocket.disconnect();
    	}
    	if(this.articleSocket && this.articleSocket.connected) {
    		this.articleSocket.disconnect();
    	}
	}

	connectToGlobalRoom(user : User) {
		this.globalSocket = io(CollaborationConstants.BASE_SOCKET_URL, {
			reconnection: true,
			query: {
				roomId: CollaborationConstants.GLOBAL_ROOM,
				assignedColor: user.assignedColor,
				name: user.name
			}
		});

		this.globalSocket.on('connect', () => {
			this.updateGlobalRoomUsers.next({
				add: true,
				user: user
			});
			this.connectedToGlobal.next(true);
		});

		this.globalSocket.on('disconnected', () => {
			this.disconectedFromGlobalRoom.next(true);
		});

		this.globalSocket.on('newArrival', newArrival => {
			this.updateGlobalRoomUsers.next({
				add: true,
				user: new User(newArrival.name, newArrival.assignedColor)
			});
		});

		this.globalSocket.on('someoneLeft', dismissed => {
			this.updateGlobalRoomUsers.next({
				add: false,
				user: new User(dismissed.name, null)
			});
		});

		this.globalSocket.on('roomiesListEvent', data => {
			for(let i=0;i<data.roomies.length;i++) {
				var user = new User(data.roomies[i].name, data.roomies[i].assignedColor);
				this.updateGlobalRoomUsers.next({
					add: true,
					user: user
				});
			}
		});

		this.globalSocket.on('noobNodeSyncRequestEvent', newbie => {
			if(this.globalMaster) {
				this.noobNodeSyncRequest.next(newbie);
			}
		});

		this.globalSocket.on('masterAssignEvent', (data) => {
			console.log('global master', data);
			this.globalMaster = data.isMaster;
			this.updateGlobalMaster.next(data.isMaster);
		});

		this.globalSocket.on('nodeDeletionEvent', node => {
            this.nodeDeletion.next(node);
        });

        this.globalSocket.on('newNodeEvent', node => {
           	this.nodeCreation.next(node);
        });

        this.globalSocket.on('nodeSyncResponseEvent', nodes => {        	
        	this.nodeSync.next(nodes);
        });

        this.globalSocket.on('nodeMovedEvent', data => {
           this.nodeMoved.next(data);
        });

        this.globalSocket.on('nodeUpdatedEvent', node => {
           this.nodeUpdated.next(node);
        });
	}

	emitNodeDeletion(node) {
		this.globalSocket.emit('nodeDeletionEvent', node);
	}

	emitNodeCreation(node) {
		this.globalSocket.emit('newNodeEvent', node);
	}

	emitNodeMoved(node, oldParentId) {
		this.globalSocket.emit('nodeMovedEvent', {
			node: node,
			oldParentId: oldParentId});
	}

	emitNodeUpdated(node) {
		this.globalSocket.emit('nodeUpdatedEvent', node);
	}

	emitNodeSync(nodeSocketInfo) {
		this.globalSocket.emit('nodeSyncEvent', nodeSocketInfo);
	}

	connectToArticleRoom(user : User, roomId : string) {
		this.articleSocket = io(CollaborationConstants.BASE_SOCKET_URL, {
			reconnection: true,
			query: {
				roomId: roomId,
				assignedColor: user.assignedColor,
				name: user.name
			}
		});

		this.articleSocket.on('connect', () => {
			this.updateArticleRoomUsers.next({
				add: true,
				user: user
			});
			this.connectedToArticleRoom.next(true);
		});

		this.articleSocket.on('newArrival', newArrival => {
			this.updateArticleRoomUsers.next({
				add: true,
				user: new User(newArrival.name, newArrival.assignedColor)
			});
		});

		this.articleSocket.on('someoneLeft', dismissed => {
			this.updateArticleRoomUsers.next({
				add: false,
				user: new User(dismissed.name, null)
			});
		});

		this.articleSocket.on('roomiesListEvent', data => {
			for(let i=0;i<data.roomies.length;i++) {
				var user = new User(data.roomies[i].name, data.roomies[i].assignedColor);
				this.updateArticleRoomUsers.next({
					add: true,
					user: user
				});
			}
		});

		this.articleSocket.on('masterAssignEvent', data => {
			console.log('article master', data);
			this.articleMaster = data.isMaster;
			this.updateArticleMaster.next(data.isMaster);
		});

		this.articleSocket.on('disconnected', () => {
			this.disconectedFromArticleRoom.next(true);
		});

		this.articleSocket.on('noobArticleSyncRequestEvent', data => {
			if(this.articleMaster) {
				console.log('noobarticlesyncrequest', data, this.articleMaster);
				this.noobArticleSyncRequest.next(data);
			}
		});

		this.articleSocket.on('articleSyncResponseEvent', data => {
			this.articleSyncUpdate.next(data);
		});

		this.articleSocket.on('remoteDeltaEvent', data => {
			console.log(data);
			this.remoteDelta.next(data);
		});

	}

	disconnectFromArticleRoom() {
		if(this.articleSocket) {
			this.articleSocket.disconnect();
		}
	}

	emitArticleSync(articleSocketInfo) {
		this.articleSocket.emit('articleSyncEvent', articleSocketInfo);
	}

	emitDelta(data) {
		console.log(data);
		this.articleSocket.emit('remoteDeltaEvent', data);
	}

	isGlobalMaster() {
		return this.globalMaster;
	}

	isArticleMaster() {
		return this.articleMaster;
	}

}