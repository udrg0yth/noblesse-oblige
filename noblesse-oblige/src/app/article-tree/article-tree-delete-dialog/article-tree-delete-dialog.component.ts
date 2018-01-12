import { Component, ViewChild, Inject, AfterViewInit} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions } from 'angular-tree-component';


@Component({
  selector: 'article-tree-delete-dialog',
  templateUrl: './article-tree-delete-dialog.component.html'
})
export class ArticleTreeDeleteDialogComponent implements AfterViewInit{
  name :string;
  nodes = [];
  options: ITreeOptions = {
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          if (node.hasChildren) {
            TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
          } 
        }
      },
      keys: {
        [KEYS.ENTER]: (tree, node, $event) => {

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
  @ViewChild('tree') tree;

  constructor(private articleTreeNewDialogRef: MatDialogRef<ArticleTreeDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public node: any) {
  	this.name = node.name;
    this.nodes.push(node);
  }

  ngAfterViewInit() {
    this.tree.treeModel.expandAll();
  }
}