import { Comparable } from './comparable';

export class DeltaModel extends Comparable<DeltaModel> {
	private _delta :any;
	private _timestamp :number;
	private _range :any;
	private _source :string;

	constructor(delta :any, timestamp :number, range: any, source : string) {
		super();
		this._delta = delta;
		this._range = range;
		this._source = source;
		this._timestamp = timestamp;
	}

	get delta() :any {
		return this._delta;
	}

	get timestamp() :number {
		return this._timestamp;
	}

	get range() :any {
		return this._range;
	}

	get source() :any {
		return this._source;
	}

	compareTo(deltaModel :DeltaModel) :number {
		return this._timestamp - deltaModel.timestamp;
	}
}