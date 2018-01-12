import { Injectable } from '@angular/core';
import { ArticleTreeConstants} from './article-tree.constants';
import { Observable, Subject } from 'rxjs/Rx';
import { CollaborationService } from '../collaboration/collaboration.service';
import { ArticleTreeDbUpdateService } from './article-tree.dbupdate.service';
import { User } from '../models/user';
import { RoomUsers } from '../models/room-users';
import { NotificationsService } from 'angular2-notifications';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';

@Injectable()
export class ArticleTreeService {
	private nodes : Array<any>;
	private roomUsers : RoomUsers = new RoomUsers();
	private tree :any;

	private nodesUpdate = new Subject<any>();
	nodesUpdate$ = this.nodesUpdate.asObservable();


	private roomUsersUpdate = new Subject<RoomUsers>();
	roomUsersUpdate$ = this.roomUsersUpdate.asObservable();

	constructor(private collaborationService : CollaborationService,
		private articleTreeDbUpdateService : ArticleTreeDbUpdateService,
		private notificationsService: NotificationsService,
		private editorService : EditorService,
		private router : Router) {
		this.articleTreeDbUpdateService.nodeRetrieval$.subscribe(nodes => {
			this.nodes = nodes;
			this.pushNodesToComponent();
		});
	}

	connectToRoom(user : User) {
		console.log('connectToRoom');
		this.collaborationService.connectToGlobalRoom(user);
		this.collaborationService.updateGlobalRoomUsers$.subscribe(userEvent => {
			console.log(userEvent);
			let user = userEvent.user;
			if(userEvent.add) {
				this.roomUsers.addUser(user);
			} else {
				this.roomUsers.removeUser(user);
			}
			this.roomUsersUpdate.next(this.roomUsers);
		});

		this.collaborationService.updateGlobalMaster$.subscribe(isMaster => {
			if(isMaster) {
				 this.articleTreeDbUpdateService.retrieveNodes().subscribe(data => {
					 this.nodes = data;
					 this.pushNodesToComponent();
				}, error => {});
				/* setInterval(() => {
					console.log('at saving', this.nodes);
				 	this.notificationsService.info('', 'Autosaving...');
				 		this.saveNodes()
				 	.subscribe(data=>{
				 		//this.retrieveNodes();
				 	}, error => {});
				 }, ArticleTreeConstants.SAVE_INTERVAL);*/
			}
		});

		this.collaborationService.nodeCreation$.subscribe(node => {
			let parent = this.findNode(node.parentId);
			parent.children.push(node);
			if(this.collaborationService.isGlobalMaster()) {
				console.log('Saving node event');
				this.articleTreeDbUpdateService.saveNode(node);
			}
			this.pushNodesToComponent();
			this.tree.treeModel.update();
		});

		this.collaborationService.nodeUpdated$.subscribe(node => {
			let nodeToUpdate = this.findNode(node.id);
			nodeToUpdate.name = node.name;
			if(this.collaborationService.isGlobalMaster()) {
				this.articleTreeDbUpdateService.saveNode(node);
			}
			this.pushNodesToComponent();
			this.tree.treeModel.update();
		});

		this.collaborationService.nodeDeletion$.subscribe(node => {
			let parent = this.findNode(node.parentId);
			for(let i=0;i<parent.children.length;i++) {
				if(parent.children[i].id == node.id) {
					parent.children.splice(i, 1);
					if(this.collaborationService.isGlobalMaster()) {
						this.articleTreeDbUpdateService.deleteNode(node);
					}
					this.pushNodesToComponent();
					this.tree.treeModel.update();
				}
			}
		});

		this.collaborationService.noobNodeSyncRequest$.subscribe(newbie => {
			this.collaborationService.emitNodeSync({
				socketId: newbie.socketId,
				nodes: this.nodes
			});
		});

		this.collaborationService.nodeSync$.subscribe(nodes => {
			this.nodes = nodes;
			this.pushNodesToComponent();
		});

		this.collaborationService.connectedToGlobal$.subscribe(connected => {
		});
	}

	findNode(nodeId) {
		let queue = [].concat(this.nodes);
		while(queue.length != 0) {
			let candidateNode = queue.shift();
			if(candidateNode.id === nodeId) {
				return candidateNode;
			} else {
				if(candidateNode.children) {
					for(let children of candidateNode.children) {
						queue.push(children);
					}
				}
			}
		}
		return null;
	}

	findAndDeleteNode(nodeId) {
		let queue = [].concat(this.nodes);
		queue.push(this.nodes);
		while(queue.length != 0) {
			let candidateNode = queue.shift();
			if(candidateNode.children) {
				let childrenNodes = candidateNode.children;
				for(let i=0;i<childrenNodes.length;i++) {
					console.log(childrenNodes[i].id);
					if(childrenNodes[i].id === nodeId) {
						this.collaborationService.emitNodeDeletion(childrenNodes[i]);
						childrenNodes.splice(i, 1);
						if(this.collaborationService.isGlobalMaster()) {
							this.articleTreeDbUpdateService.deleteNode(childrenNodes[i]);
						}
						this.pushNodesToComponent();
						return;
					} 
					queue.push(childrenNodes[i]);
				}
			}
		}
	}

	addNode(parentId, node) {
		let parent = this.findNode(parentId);
		parent.hasChildren = true;
		let parentContent = parent.content;
		node.content = parentContent;
		node.parentId = parent.id;
		//parentContent = null;
		parent.children.push(node);
		this.collaborationService.emitNodeCreation(node);
		if(this.collaborationService.isGlobalMaster()) {
			console.log('Saving node');
			this.articleTreeDbUpdateService.saveNode(node);
		}
	}

	editNode(nodeId, newName) {
		let node = this.findNode(nodeId);
		node.name = newName;
		this.pushNodesToComponent();
		this.collaborationService.emitNodeUpdated(node);
		if(this.collaborationService.isGlobalMaster()) {
			this.articleTreeDbUpdateService.saveNode(node);
		}
	}

	createNewNode(parentNode, name) {
		let id = UUID.UUID();
		let newNode = {id: id, name: name, children:[]};
		this.addNode(parentNode.data.id, newNode);
		parentNode.treeModel.update();
		
		if(parentNode.isCollapsed) {
			parentNode.expand();
		}
		this.nodeIsSelected(parentNode.treeModel.getNodeById(id));
		this.pushNodesToComponent();
	}
	
	private nodeIsSelected(node :any) {
		node.setIsActive(true);
      	//this.editorService.setIsLeaf(true);
      	//this.editorService.setCurrentNode(this.articleTreeService.findNode(node.data.id));
	}
	
	private pushNodesToComponent() {
		this.nodesUpdate.next(this.nodes);
	}

	setTree(tree) {
		this.tree = tree;
	}
		
}