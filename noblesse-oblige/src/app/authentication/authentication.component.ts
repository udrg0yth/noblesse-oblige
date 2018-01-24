import { Component, Compiler } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
@Component({
  selector: 'authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.css']
})
export class AuthenticationComponent {
	user = {
		name: null,
		password: null
	};

	constructor(private authenticationService :AuthenticationService, private router: Router, private compiler: Compiler) {
		compiler.clearCache();
	}

	onSubmit() {
		if(this.user.name && this.user.password) {
			this.authenticationService
			.authenticate(this.user).subscribe(result => {
				if(result) {
					this.router.navigateByUrl('/documents');
				}
			}, error => {
			});
		}
	}
}