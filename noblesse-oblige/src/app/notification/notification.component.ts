import { Component } from '@angular/core';

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
	public notificationOptions = {
	    position: ["bottom", "left"],
	    timeOut: 2000,
	    lastOnBottom: true,
	    showProgressBar: true,
	    pauseOnHover: false,
	    clickToClose: false,
	    maxLength: 10
	};

	constructor() {
	}
}