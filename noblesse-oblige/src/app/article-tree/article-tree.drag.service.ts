import { Injectable } from '@angular/core';
import { ArticleTreeService } from './article-tree.service';
import { DragState } from './article-tree.drag.state';

@Injectable()
export class ArticleTreeDragService {
	private dragState : number;
	private nodeId : string;
	private oldParentId : string;

	constructor(private articleTreeService : ArticleTreeService) {
	}

	beginDrag(node : any) {
		console.log('Begin drag of node', node.data);
		this.dragState = DragState.DRAGGING;
		this.nodeId = node.data.id;
		this.oldParentId = node.data.parentId;
		//console.log(node.data.id);
		//console.log(this.oldParentId);
	}

	drop(node : any) {
		console.log('Dropping node', node.data);
		this.dragState = DragState.DROPPED;
		let newParentId = node.data.id;
		console.log('Node id dragged', this.nodeId);
		console.log('Old parent id of node', this.oldParentId);
		console.log('New parentId of node', newParentId);
		if(this.nodeId != newParentId && this.oldParentId) {
			this.articleTreeService.moveNode(this.oldParentId, newParentId, this.nodeId);
		}
	}

}