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

	deleteNode(node) {
		return this.customHttp
        .post(`${GenericConstants.BASE_URL}${ArticleTreeConstants.DELETE_NODE}`, node)
        .map((response :Response) => {
        	return true;
        })
        .catch((error :Response | any) => {
			return Observable.throw(error);
        }).subscribe(res => {
        	this.retrieveNodes().subscribe(nodes =>{
        		this.nodeRetrieval.next(nodes);
        	}, err =>{});
        }, err => {

        });
	}

	saveNode(node) {
		return this.customHttp
        .post(`${GenericConstants.BASE_URL}${ArticleTreeConstants.SAVE_NODE}`, node)
        .map((response :Response) => {
        	return true;
        })
        .catch((error :Response | any) => {
			return Observable.throw(error);
        }).subscribe(res => {
        	this.retrieveNodes().subscribe(nodes =>{
        		this.nodeRetrieval.next(nodes);
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
}