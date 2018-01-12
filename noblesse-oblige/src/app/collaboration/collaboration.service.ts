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

	private nodeDeletion = new Subject<any>();
	nodeDeletion$ = this.nodeDeletion.asObservable();

	private nodeCreation = new Subject<any>();
	nodeCreation$ = this.nodeCreation.asObservable();

	private nodeUpdated = new Subject<any>();
	nodeUpdated$ = this.nodeUpdated.asObservable();

	private noobNodeSyncRequest = new Subject<any>();
	noobNodeSyncRequest$ = this.noobNodeSyncRequest.asObservable();

	private nodeSync = new Subject<any>();
	nodeSync$ = this.nodeSync.asObservable();

	private connectedToGlobal = new Subject<any>();
	connectedToGlobal$ = this.connectedToGlobal.asObservable();


	constructor(private authenticationService : AuthenticationService) {
		authenticationService.onLogout$.subscribe(logout => {
			this.closeSockets();
		});
	}

	ngOnDestroy() {
		console.log('destroying');
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
		console.log('connecting', user);
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

		this.globalSocket.on('newArrival', newArrival => {
			console.log(newArrival);
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
			console.log('roomies');
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
				console.log('noobNodeSyncRequestEvent', newbie);
				this.noobNodeSyncRequest.next(newbie);
			}
		});

		this.globalSocket.on('masterAssignEvent', () => {
			this.globalMaster = true;
			console.log('master');
			this.updateGlobalMaster.next(true);
		});

		this.globalSocket.on('nodeDeletionEvent', node => {
            this.nodeDeletion.next(node);
        });

        this.globalSocket.on('newNodeEvent', node => {
           	this.nodeCreation.next(node);
        });

        this.globalSocket.on('nodeSyncResponseEvent', nodes => {
        	console.log('nodeSyncResponseEvent', nodes);
        	this.nodeSync.next(nodes);
        });

        this.globalSocket.on('nodeMovedEvent', node => {
           //	this.nodeMoved.next(node);
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

	emitNodeMoved(node) {
		this.globalSocket.emit('nodeMovedEvent', node);
	}

	emitNodeUpdated(node) {
		this.globalSocket.emit('nodeUpdatedEvent', node);
	}

	emitNodeSync(nodeSocketInfo) {
		console.log('emit node sync');
		this.globalSocket.emit('nodeSyncEvent', nodeSocketInfo);
	}

	connectToArticleRoom(user : User, roomId : string) {

	}

	disconnectFromArticleRoom() {
		if(this.articleSocket) {
			this.articleSocket.disconnect();
		}
	}

	isGlobalMaster() {
		return this.globalMaster;
	}


}