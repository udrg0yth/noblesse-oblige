import { PriorityQueue } from './priority-queue';
import { DeltaModel } from './delta-model';

export class DeltaSyncQueue extends PriorityQueue<DeltaModel>{
	private _lastUpdatedTime : number;

	public retrieveDeltasAfter() : Array<DeltaModel> {
		let deltas = [];
		while(!super.isEmpty()) {
			let deltaModel = super.pop();
			if(deltaModel.timestamp > this._lastUpdatedTime) {
				if(super.asArray().length == 0) {
					this._lastUpdatedTime  = deltaModel.timestamp;
				} 
				deltas.push(deltaModel);
			} 
		}
		return deltas;
	}

	set lastUpdatedTime(timestamp : number) {
		this._lastUpdatedTime = timestamp;
	}
}