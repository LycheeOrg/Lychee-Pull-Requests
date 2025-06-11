import { defineStore } from 'pinia';

export type QueryStore = ReturnType<typeof useQueryStore>;

export const useQueryStore = defineStore('queries', {
	state: () => {
		return {
			data: {} as Record<string, object>,
			updated: 0 as number,
		};
	},
	actions: {
		save(url: string, result: object) {
			this.data[url] = result;
			this.updated = Date.now();
		},
		get(url: string): object | undefined {
			// 1 hour cache
			if (this.updated < Date.now() - 1000 * 60 * 60) {
				console.log('QueryStore: Cache expired, resetting store.');
				this.reset();
				return undefined;
			}

			if (!(url in this.data)) {
				return undefined;
			}
			console.log(`QueryStore: Returning cached data for ${url}`);
			return this.data[url];
		},
		reset() {
			this.data = {};
		},
	},
	persist: true,
});
