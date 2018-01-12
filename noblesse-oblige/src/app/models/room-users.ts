import { User } from './user';

export class RoomUsers {
	private _users: Array<User>;

	constructor() {
		this._users = [];
	}

	public addUser(user: User) {
		if(user.name && this.findIndexByName(user) == -1) {
			this._users.push(user);
		}
	}

	public getUsers() :Array<User> {
		return this._users;
	}

	public removeUser(user) {
		console.log(user.name);
		let index = this.findIndexByName(user);
		console.log(index);
		if(index != -1) {
			this._users.splice(index, 1);
		}
		console.log(this._users);
	}

	private findIndexByName(user) {
		return this._users.findIndex(userCandidate => userCandidate.name == user.name);
	}
}