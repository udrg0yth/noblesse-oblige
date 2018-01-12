import { Injectable } from '@angular/core';
import { AuthenticationConstants } from './authentication.constants';
import { Router } from '@angular/router';
import { CustomHttp } from '../generics/generics.interceptor';
import { GenericConstants } from '../generics/generics.constants';
import { Headers, Response } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import { User } from '../models/user';
import { JwtHelper } from 'angular2-jwt';

@Injectable()
export class AuthenticationService {
	private jwtHelper :JwtHelper;
	private user : User;

    private onLogout = new Subject<boolean>();
    onLogout$ = this.onLogout.asObservable();
	
	constructor(private customHttp: CustomHttp, private router: Router) {
        this.jwtHelper = new JwtHelper;
        if(this.isAuthenticated()) {
            this.setClaims(localStorage.getItem('token'));
        }

        this.customHttp.logout$.subscribe(logout => {
            this.logout();
            this.onLogout.next(true);
        });
	}

	authenticate(user) :Observable<any> {
		let authHeader = new Headers();
		    authHeader.append('Authorization', btoa(user.name + ':' + user.password));
		return this.customHttp
        .get(`${GenericConstants.BASE_URL}${AuthenticationConstants.LOGIN_URL}`, {
        	headers: authHeader
        })
        .map((response :Response) => {
            return response.headers.get('x-auth-token') != null;
        })
        .catch((error :Response | any) => {
        	error.authentication = error.headers.get('x-auth-token') != null;
			return Observable.throw(error);
        });
	}

    isAuthenticated() :Observable<any>{
        return this.customHttp
        .get(`${GenericConstants.BASE_URL}${AuthenticationConstants.CHECK_AUTHENTICATION}`)
        .map((response :Response) => {
            return true;
        })
        .catch((error :Response | any) => {
            error.authentication = error.headers.get('x-auth-token') != null;
            return Observable.throw(error);
        });
    }

    logout() :void{
        localStorage.removeItem('token');
        console.log(localStorage.getItem('token'));
        this.router.navigateByUrl('login');
    }

    setClaims(token) :void {
        console.log(token);
       if(token) {
           let decoded = this.jwtHelper.decodeToken(token);
           this.user = new User(decoded.username, decoded.assignedUserColor);
       }
    }

    getClaims() :User {
        let token = localStorage.getItem('token');
        if(token) {
           let decoded = this.jwtHelper.decodeToken(token);
           console.log(decoded);
           this.user = new User(decoded.username, decoded.assignedUserColor);
        }
        return this.user;
    }
}