import { Injectable } from '@angular/core';
import { CustomHttp } from '../generics/generics.interceptor';
import { GenericConstants } from '../generics/generics.constants';
import { ArticleTreeConstants} from './article-tree.constants';
import { Headers, Response } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class ArticleTreeDbUpdateService {
	private nodeRetrieval = new Subject<any>();
	nodeRetrieval$ = this.nodeRetrieval.asObservable();

	constructor(private customHttp :CustomHttp) {
	}

	deleteNode(nodes) {
		return this.customHttp
                .post(`${GenericConstants.BASE_URL}${ArticleTreeConstants.DELETE_NODE}`, { nodeIds: nodes})
                .map((response :Response) => {
                	return true;
                })
                .catch((error :Response | any) => {
        			return Observable.throw(error);
                }).subscribe(res => {
                	this.retrieveNodes().subscribe(nodes =>{
                		this.nodeRetrieval.next({
                                        nodes: nodes,
                                        add: false,
                                        remote:false,
                                        savedNodeId: null});
                	}, err =>{});
                }, err => {
                });
	}

	saveNode(node, add : boolean, remote: boolean, callbackSaved, callbackRetrieve) {
		return this.customHttp
                .post(`${GenericConstants.BASE_URL}${ArticleTreeConstants.SAVE_NODE}`, node)
                .map((response :Response) => {
                	return true;
                })
                .catch((error :Response | any) => {
        			return Observable.throw(error);
                }).subscribe(res => {
                        console.log('saved');
                        if(callbackSaved) {
                                callbackSaved();
                        }
                	this.retrieveNodes().subscribe(nodes =>{
                                if(callbackRetrieve) {
                                    callbackRetrieve(nodes);
                                }
                		this.nodeRetrieval.next({
                			nodes: nodes,
                			add : add,
                			remote : remote,
                			savedNodeId : node.id});
                	}, err =>{});
                }, err => {
                });
	}

	retrieveNodes() :any {
		return this.customHttp
                .get(`${GenericConstants.BASE_URL}${ArticleTreeConstants.GET_NODES}`)
                .map((response :Response) => {
                	return response.json() || {};
                })
                .catch((error :Response | any) => {
			return Observable.throw(error);
                });
	}

    retrieveNodesAndPush(add :boolean, remote : boolean) {
        this.retrieveNodes().subscribe(nodes =>{
            this.nodeRetrieval.next({
                nodes: nodes,
                add : add,
                remote : remote,
                savedNodeId : null});
        }, err =>{});
    }
}