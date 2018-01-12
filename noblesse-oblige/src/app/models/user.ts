export class User {
	private _name :string;
	private _assignedColor :string;

	constructor(name: string, assignedColor :string) {
		this._name = name;
		this._assignedColor = assignedColor;
	}

	set name(name :string) {
		this._name = name;
	}

	get name() :string {
		return this._name;
	}

	set assignedColor(assignedColor :string) {
		this._assignedColor = assignedColor;
	}

	get assignedColor() :string {
		return this._assignedColor;
	}
}