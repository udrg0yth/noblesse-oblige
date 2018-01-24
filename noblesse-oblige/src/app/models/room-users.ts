import { User } from './user';

export class RoomUsers {
	private _users: Array<User>;

	constructor() {
		this._users = [];
	}

	public addUser(user: User) {
		//if(user.name && this.findIndexByName(user) == -1) {
			this._users.push(user);
		//}
	}

	public getUsers() :Array<User> {
		return this._users;
	}

	public removeUser(user) {
		let index = this.findIndexByName(user);
		if(index != -1) {
			this._users.splice(index, 1);
		}
	}

	private findIndexByName(user) {
		return this._users.findIndex(userCandidate => userCandidate.name == user.name);
	}

	public findByName(user) {
		let index = this.findIndexByName({
			name:user
		});
		if(index != -1) {
			return this._users[index];
		}
	}
}