import { Component, ViewChild, Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'article-tree-new-dialog',
  templateUrl: './article-tree-new-dialog.component.html'
})
export class ArtricleTreeNewDialogComponent {
  @ViewChild('nodeNameInput')
  private nodeNameInput :any;
  name :string;
  
  constructor(private articleTreeNewDialogRef: MatDialogRef<ArtricleTreeNewDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  	if(data) {
  		this.name = data;
  	}
  }

  createNewNode() {
    this.articleTreeNewDialogRef.close(this.nodeNameInput.nativeElement.value);
  }
}