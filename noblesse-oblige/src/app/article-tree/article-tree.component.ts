
import { Component, ViewChild, OnInit, NgZone } from '@angular/core';
import { TREE_ACTIONS, IActionMapping, ITreeOptions, TreeComponent } from 'angular-tree-component';
import {ContextMenuComponent, ContextMenuService} from 'ngx-contextmenu';
import { ArticleTreeService } from './article-tree.service';
import { MatDialog, MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { ArtricleTreeNewDialogComponent } from './article-tree-new-dialog/article-tree-new-dialog.component';
import { ArticleTreeDeleteDialogComponent } from './article-tree-delete-dialog/article-tree-delete-dialog.component';
import { EditorService } from '../editor/editor.service';
import { Router } from '@angular/router';
import { RoomUsers } from '../models/room-users';
import { AuthenticationService } from '../authentication/authentication.service';


@Component({
  selector: 'article-tree',
  templateUrl: './article-tree.component.html',
  styleUrls: ['./article-tree.component.css']
})
export class ArticleTreeComponent implements OnInit {
	@ViewChild(ContextMenuComponent) 
	basicMenu : ContextMenuComponent;
	@ViewChild(TreeComponent)
  	private tree: TreeComponent;

	options: ITreeOptions = {
		actionMapping: {
		  mouse: {
		    click: (tree, node, $event) => {
		      if (node.hasChildren) {
		      	TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
		      } else {
		      	node.setIsActive(true);
		      }
		    },
		    contextMenu: (tree, node, $event) => {
		      if(node.data.parentId) {
			  	this.showContextMenu(node, $event);
			  }
		    }
		  }
		},
		allowDrag: (node) => {
		  return true;
		},
		nodeHeight: 30,
		useVirtualScroll: true,
		animateExpand: true,
		animateSpeed: 5,
		animateAcceleration: 1
	};
	
	nodes = [];
	roomUsers :RoomUsers = new RoomUsers();

	ngOnInit() {
		this.articleTreeService.setTree(this.tree);
	}


	constructor(private contextMenuService: ContextMenuService, 
		private articleTreeService: ArticleTreeService, 
		private dialog: MatDialog, 
		private editorService : EditorService,
		private authenticationService : AuthenticationService,
		private router : Router,
		private iconRegistry: MatIconRegistry, 
		private sanitizer: DomSanitizer,
		private ngZoneService : NgZone) {
		this.authenticationService.isAuthenticated().subscribe(data => {
				this.addIcons();

				this.articleTreeService.nodesUpdate$.subscribe(nodes => {
					this.ngZoneService.run(() => {
						this.nodes = nodes;
					});
				});
				this.articleTreeService.roomUsersUpdate$.subscribe(roomUsers => {
					this.ngZoneService.run(() => {
					this.roomUsers = roomUsers;
					});
				});
				this.articleTreeService.connectToRoom(this.authenticationService.getClaims());
		}, error => {
				this.router.navigateByUrl('login');
		});
	}

	private addIcons() {
		this.iconRegistry.addSvgIcon(
		'account_box',
		this.sanitizer.bypassSecurityTrustResourceUrl('assets/account_box/ic_account_box_24px.svg'));
		this.iconRegistry.addSvgIcon(
		'exit_app',
		this.sanitizer.bypassSecurityTrustResourceUrl('assets/account_box/ic_exit_to_app_white_36px.svg'));
	}
	
	showContextMenu(node, $event) {
		this.contextMenuService.show.next({
			anchorElement: $event.target,
			contextMenu: this.basicMenu,
			event: <any>$event,
			item: node
		});
		$event.preventDefault();
		$event.stopPropagation();
	}

	showEditNode(node) {
		this.dialog.closeAll();
		let dialogRef = this.dialog
		.open(ArtricleTreeNewDialogComponent, {width: "20vw", data: node.data.name});
		dialogRef.updatePosition({ top: '5%', left: '45%' });
		dialogRef.afterClosed().subscribe(result => {
			if(result != null && result !== '') {
				this.articleTreeService.editNode(node.data.id, result);
			}
		});
	}

	showNewChildCreation(node) {
		this.dialog.closeAll();
		let dialogRef = this.dialog
		.open(ArtricleTreeNewDialogComponent, {width: "20vw"});
		dialogRef.updatePosition({ top: '5%', left: '45%' });
		dialogRef.afterClosed().subscribe(result => {
			if(result != null && result !== '') {
				this.articleTreeService.createNewNode(node, result);
			}
		});
	}

	showDeleteNode(node) {
		this.dialog.closeAll();
		let dialogRef = this.dialog
		.open(ArticleTreeDeleteDialogComponent, {width: "50vw", height: "60vh", data: this.articleTreeService.findNode(node.data.id)});
		dialogRef.updatePosition({ top: '5%', left: '30%' });
		dialogRef.afterClosed().subscribe(result => {
			if(result) {
				this.articleTreeService.findAndDeleteNode(node.data.id);
				node.treeModel.update();
			}
		});
	}
}