import { Injectable, OnDestroy, Compiler } from '@angular/core';
import { ArticleTreeConstants} from './article-tree.constants';
import { Observable, Subject } from 'rxjs/Rx';
import { CollaborationService } from '../collaboration/collaboration.service';
import { ArticleTreeDbUpdateService } from './article-tree.dbupdate.service';
import { User } from '../models/user';
import { RoomUsers } from '../models/room-users';
import { NotificationsService } from 'angular2-notifications';
import { EditorStateService } from '../editor/editor.state.service';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';

@Injectable()
export class ArticleTreeService implements OnDestroy{
	private nodes : Array<any>;
	private roomUsers : RoomUsers = new RoomUsers();
	private tree :any;

	private nodesUpdate = new Subject<any>();
	nodesUpdate$ = this.nodesUpdate.asObservable();


	private roomUsersUpdate = new Subject<RoomUsers>();
	roomUsersUpdate$ = this.roomUsersUpdate.asObservable();

	constructor(private collaborationService : CollaborationService,
		private articleTreeDbUpdateService : ArticleTreeDbUpdateService,
		private editorStateService : EditorStateService,
		private router : Router,
		private compiler : Compiler) {
		this.articleTreeDbUpdateService.nodeRetrieval$.subscribe(data => {
			this.nodes = data.nodes;
			this.pushNodesToComponent();
			if(!data.remote && data.add) {
		      	this.editorStateService.changeArticle(this.findNode(data.savedNodeId));
			}
		});

		this.collaborationService.updateGlobalRoomUsers$.subscribe(userEvent => {
			console.log(userEvent);
			let user = userEvent.user;
			if(userEvent.add) {
				this.roomUsers.addUser(user);
			} else {
				this.roomUsers.removeUser(user);
			}
			this.roomUsersUpdate.next(this.roomUsers);
			console.log('update global', this.roomUsers);
		});

		this.collaborationService.updateGlobalMaster$.subscribe(isMaster => {
			if(isMaster) {
				 this.articleTreeDbUpdateService.retrieveNodes().subscribe(data => {
				 	console.log('nodes', data);
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
				this.articleTreeDbUpdateService.saveNode(node, true, true, null, null);
			} else {
				this.pushNodesToComponent();
			}
		});

		this.collaborationService.nodeUpdated$.subscribe(node => {
			let nodeToUpdate = this.findNode(node.id);
			nodeToUpdate.name = node.name;
			if(this.collaborationService.isGlobalMaster()) {
				this.articleTreeDbUpdateService.saveNode(node, false, true, null, null);
			} else {
				this.pushNodesToComponent();
			}
		});

		this.collaborationService.nodeMoved$.subscribe(data => {
			console.log('node moved remotely', data);
			let oldParentNode = this.findNode(data.oldParentId);
			let newParentNode = this.findNode(data.node.parentId);
			if(oldParentNode.id !== newParentNode.id) {
				for(let i=0; i< oldParentNode.children.length; i++) {
					if(oldParentNode.children[i].id === data.node.id) {
						oldParentNode.children.splice(i, 1);
					}
				}
				newParentNode.children.push(data.node);
				if(this.collaborationService.isGlobalMaster()) {
					this.articleTreeDbUpdateService.saveNode(data.node, false, true, null, null);
				} else {
					this.pushNodesToComponent();			
				}
			}
		});

		this.collaborationService.nodeDeletion$.subscribe(node => {
			let parent = this.findNode(node.parentId);
			for(let i=0;i<parent.children.length;i++) {
				if(parent.children[i].id == node.id) {
					this.clearArticleFromNodeHierarchy(parent);
					if(this.collaborationService.isGlobalMaster()) {
						this.articleTreeDbUpdateService.deleteNode(this.hierarchyIdsList(parent.children[i]));
					} else {
						parent.children.splice(i, 1);
						this.pushNodesToComponent();
					}
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

		this.collaborationService.disconectedFromGlobalRoom$.subscribe(disconnected => {
			this.roomUsers = new RoomUsers();
			this.roomUsersUpdate.next(this.roomUsers);
		});
	}

	ngOnDestroy() {
		this.compiler.clearCache();
		this.roomUsers = new RoomUsers();
		this.roomUsersUpdate.next(this.roomUsers);
	}

	connectToRoom(user : User) {
		this.collaborationService.connectToGlobalRoom(user);
	}

	clearArticleFromNodeHierarchy(root) {
		console.log('clearArticle', root, this.editorStateService.getNodeId(), this.containsInHierarchy(root, this.editorStateService.getNodeId()));
		if(this.containsInHierarchy(root, this.editorStateService.getNodeId())) {
			this.editorStateService.changeArticle({});
		}
	}

	private containsInHierarchy(node, nodeId) {
		let queue = [node];
		while(queue.length != 0) {
			let candidateNode = queue.shift();
			if(candidateNode._id === nodeId) {
				return true;
			} else {
				if(candidateNode.children) {
					for(let children of candidateNode.children) {
						queue.push(children);
					}
				}
			}
		}
		return false;
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

	private hierarchyIdsList(node) {
		let queue = [node];
		let idsList = [];
		while(queue.length !== 0) {
			let currentNode = queue.shift();
			idsList.push(currentNode._id);
			for(let children of currentNode.children) {
				queue.push(children);
			}
		}
		console.log(idsList);
		return idsList;
	}

	clearRoomUsers() {
		this.roomUsers = new RoomUsers();
		this.roomUsersUpdate.next(this.roomUsers);
	}

	findAndDeleteNode(nodeId) {
		let queue = [].concat(this.nodes);
		queue.push(this.nodes);
		while(queue.length !== 0) {
			let candidateNode = queue.shift();
			if(candidateNode.children) {
				let childrenNodes = candidateNode.children;
				for(let i=0;i<childrenNodes.length;i++) {
					console.log(childrenNodes[i].id);
					if(childrenNodes[i].id === nodeId) {
						this.collaborationService.emitNodeDeletion(childrenNodes[i]);
						this.clearArticleFromNodeHierarchy(candidateNode);
						if(this.collaborationService.isGlobalMaster()) {
							this.articleTreeDbUpdateService.deleteNode(this.hierarchyIdsList(childrenNodes[i]));
						} else {
							childrenNodes.splice(i, 1);
							this.pushNodesToComponent();
						}
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
		parent.children.push(node);
		if(this.collaborationService.isGlobalMaster()) {
			console.log('Saving node');
			this.articleTreeDbUpdateService.saveNode(node, true, false, null, (nodes) => {
				console.log('callback node', nodes);
				this.nodes = nodes;
				let updatedNode = this.findNode(node.id);
				this.collaborationService.emitNodeCreation(updatedNode);
			});
		} else {
			this.collaborationService.emitNodeCreation(node);
		}
	}

	moveNode(oldParentId, newParentId, nodeId) {
		let node = this.findNode(nodeId);
		let oldParentNode = this.findNode(oldParentId);
		let newParentNode = this.findNode(newParentId);
		console.log(node, oldParentNode, newParentNode);
		for(let i=0; i< oldParentNode.children.length; i++) {
			if(oldParentNode.children[i].id === nodeId) {
				console.log('Node spliced', oldParentNode.children[i]);
				oldParentNode.children.splice(i, 1);
				console.log('Current tree state', this.nodes);
			}
		}
		node.parentId = newParentId;
		newParentNode.children.push(node);
		this.collaborationService.emitNodeMoved(node, oldParentId);
		if(this.collaborationService.isGlobalMaster()) {
			this.articleTreeDbUpdateService.saveNode(node, false, false, null, null);
		} else {
			this.pushNodesToComponent();
		}
	}

	editNode(nodeId, newName) {
		let node = this.findNode(nodeId);
		node.name = newName;
		this.collaborationService.emitNodeUpdated(node);
		if(this.collaborationService.isGlobalMaster()) {
			this.articleTreeDbUpdateService.saveNode(node, false, false, null, null);
		} else {
			this.pushNodesToComponent();
		}
	}

	createNewNode(parentNode, name) {
		let id = UUID.UUID();
		let newNode = {id: id, name: name, children:[]};
		this.addNode(parentNode.data.id, newNode);
		this.tree.treeModel.update();
		if(parentNode.isCollapsed) {
			parentNode.expand();
		}
		this.nodeIsSelected(parentNode.treeModel.getNodeById(id));
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