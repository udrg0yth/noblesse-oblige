import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { Response } from '@angular/http';
import { GenericConstants } from '../generics/generics.constants';
import { EditorConstants } from './editor.constants';
import { CustomHttp } from '../generics/generics.interceptor';
import { CollaborationService } from '../collaboration/collaboration.service';
import { QuillSaveService } from './editor.quill.save.service';
import { DeltaSyncQueue } from '../models/delta-sync-queue';
import { DeltaModel } from '../models/delta-model';
import { NotificationsService } from 'angular2-notifications';

@Injectable()
export class QuillStateService {
	private deltaSyncQueue : DeltaSyncQueue;
	private quillState: number = 0;
	private quillEditor : any;
	private nodeId : string;
	private contents : any;
	private articleState : number = 0;


	public static NOT_INITIATED : number = 0;
	public static INITIATED : number = 1;
	public static CONTENT_LOADED : number = 2;

	private cursorUpdate = new Subject<any>();
	cursorUpdate$ = this.cursorUpdate.asObservable();

	constructor(private customHttp: CustomHttp, 
		private collaborationService : CollaborationService, 
		private zoneService : NgZone, 
		private quillSaveService : QuillSaveService,
		private notificationsService: NotificationsService) {
		this.deltaSyncQueue = new DeltaSyncQueue();
		this.collaborationService.noobArticleSyncRequest$.subscribe(socket => {
			console.log('noobArticleSyncRequest');
			this.getArticleContent().subscribe(data => {
				this.collaborationService.emitArticleSync({
					socketId: socket.socketId,
					content: data,
					timestamp: Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}))
				});
			}, error =>{});
		});
		this.collaborationService.articleSyncUpdate$.subscribe(data => {
			this.updateArticleContentFromPeers(data);
		});
		this.collaborationService.remoteDelta$.subscribe(data => {
			console.log('remote delta', data);
			let deltaModel :DeltaModel = new DeltaModel(data.delta, data.timestamp, data.range, data.source);
			if(this.deltaSyncQueue) {
				console.log('push delta');
				this.deltaSyncQueue.push(deltaModel);
			} else {
				console.log('apply delta');
				this.applyDeltaModel(deltaModel)
			}
		});
		this.quillSaveService.contentRequest$.subscribe(req => {
			this.quillSaveService.save(this.nodeId, this.quillEditor.getContents());
			this.notificationsService.info('', 'Saving contents');
		});
	}

	private applyDeltaModel(deltaModel :DeltaModel) {
		console.log(deltaModel);
		this.quillEditor.updateContents(deltaModel.delta, deltaModel.source);
		this.cursorUpdate.next({
			range: deltaModel.range,
			source: deltaModel.source
		});
	}

	setQuillEditor(quillEditor : any) {
		this.clearState();
		this.quillEditor = quillEditor;
		if(this.contents) {
			this.updateArticleContentFromPeers({
				 content: this.contents,
				 timestamp: Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}))
			});
			this.contents = null;
		} else {
			this.quillState = QuillStateService.INITIATED;
		}
	}

	updateArticleContentFromDatabase(nodeId : string) {
		this.clearState();
		this.nodeId = nodeId;
		console.log(this.nodeId);
		this.quillEnable(false);
		this.getArticleContentsFromDatabase().subscribe(data => {
            if(this.quillState  >= QuillStateService.INITIATED) {
				this.quillEditor.setContents(data, 'initial');
				if(this.deltaSyncQueue) {
            		this.deltaSyncQueue.lastUpdatedTime = Date.parse(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
			        let deltaModels = this.deltaSyncQueue.retrieveDeltasAfter();
            		for(let deltaModel of deltaModels) {
						this.applyDeltaModel(deltaModel);
					}
					this.deltaSyncQueue = null;
            	}
				this.quillState = QuillStateService.CONTENT_LOADED;
			} else {
				this.contents = data;
			}
		}, error => {});
		console.log(this.articleState);
		this.quillEnable(this.articleState === 3);
	}

	updateArticleContentFromPeers(data: any) {
		this.clearState();
		this.quillEnable(false);
		this.quillEditor.setContents(data.content, 'initial');
		this.quillState = QuillStateService.CONTENT_LOADED;
		if(this.deltaSyncQueue) {
			this.deltaSyncQueue.lastUpdatedTime = data.timestamp;
			let deltaModels = this.deltaSyncQueue.retrieveDeltasAfter();
			for(let deltaModel of deltaModels) {
				this.applyDeltaModel(deltaModel);
			}
			this.deltaSyncQueue = null;
		}
		console.log(this.articleState);
		this.quillEnable(this.articleState === 3);
	}

	setNodeId(nodeId : string) {
		this.nodeId = nodeId;
	}

	getArticleContent() {
		if(this.quillState !== QuillStateService.CONTENT_LOADED) {
			return this.getArticleContentsFromDatabase();
		} else {
			return new Observable(observer => observer.next(this.quillEditor.getContents()));
		}
	}

	private quillEnable(enable : boolean) {
		if(enable) {
            if(this.quillState  >= QuillStateService.INITIATED) {
				this.zoneService.run(() => {
					this.quillEditor.enable();
				});
			}
		} else {
			if(this.quillState  >= QuillStateService.INITIATED) {
				this.zoneService.run(() => {
					this.quillEditor.disable();
				});	
			}
		}
	}

	private getArticleContentsFromDatabase() : Observable<any>{
		console.log(this.nodeId);
		return this.customHttp
        .post(`${GenericConstants.BASE_URL}${EditorConstants.GET_ARTICLE_CONTENTS}`, {nodeId: this.nodeId})
        .map((response :Response) => {
        	return response.json() || {};
        })
        .catch((error :Response | any) => {
			return Observable.throw(error);
        });
	}

	onContentChanged(delta :any) {
		console.log(delta);
		this.quillSaveService.increaseCounter(delta);
	}

	clearState() {
		if(this.quillEditor) {
			this.quillState = QuillStateService.INITIATED;
		} else {
			this.quillState = QuillStateService.NOT_INITIATED;
		}
		this.nodeId = null;
		this.contents = null;
	}

	setArticleStateUpdate(onUpdate) {
		onUpdate.subscribe(articleState => {
			this.articleState = articleState;
		});
	}

	setArticleState(state) {
		this.articleState = state;
	}
}