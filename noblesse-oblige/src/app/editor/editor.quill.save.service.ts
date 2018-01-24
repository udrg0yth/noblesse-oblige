import { Injectable } from '@angular/core';
import { EditorConstants } from './editor.constants';
import { Observable, Subject } from 'rxjs/Rx';
import { Response } from '@angular/http';
import { GenericConstants } from '../generics/generics.constants';
import { CustomHttp } from '../generics/generics.interceptor';

@Injectable()
export class QuillSaveService {
	 private changesCount: number = 0;

	 private contentRequest = new Subject<boolean>();
	 contentRequest$ = this.contentRequest.asObservable();

	 constructor(private customHttp : CustomHttp ) {

	 }

	 increaseCounter(change :any){
	 	if(change.source === 'initial') {
	 		return;
	 	}
	 	if(this.containsVideo(change.delta.ops)){
	 		this.changesCount += 20;
	 	} else if(this.containsImage(change.delta.ops)) {
	 		this.changesCount += 20;
	 	} else if(this.containsFormula(change.delta.ops)) {
	 		this.changesCount += 10;
	 	} else if(this.containsCodeBlock(change.delta.ops)) {
	 		this.changesCount += 15;
	 	} else {
	 		this.changesCount += 1;
	 	}
	 	console.log(this.changesCount);
	 	if(this.changesCount >= EditorConstants.SAVE_THRESHOLD) {
	 		this.contentRequest.next(true);
	 		this.changesCount = 0;
	 	}
	 }

	 containsVideo(ops) {
	 	if(ops.length) {
	 		for(let i=0;i<ops.length;i++) {
	 			if(ops[i].insert && ops[i].insert.video) {
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 }

	 containsImage(ops) {
	 	if(ops.length) {
	 		for(let i=0;i<ops.length;i++) {
	 			if(ops[i].insert && ops[i].insert.image) {
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 }

	 containsFormula(ops) {
	 	if(ops.length) {
	 		for(let i=0;i<ops.length;i++) {
	 			if(ops[i].insert && ops[i].insert.formula) {
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 }

	 containsCodeBlock(ops) {
	 	if(ops.length) {
	 		for(let i=0;i<ops.length;i++) {
	 			if(ops[i].attributes && ops[i].attributes['code-block']) {
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 }



	 save(nodeId: string, contents : any) {
	 	return this.customHttp
            .post(`${GenericConstants.BASE_URL}${EditorConstants.SAVE_ARTICLE_CONTENT}`, {
            	nodeId: nodeId,
            	contents: contents })
            .map((response :Response) => {
            	return true;
            })
            .catch((error :Response | any) => {
    			return Observable.throw(error);
            }).subscribe(res => {
            }, error => {});
	 }
}