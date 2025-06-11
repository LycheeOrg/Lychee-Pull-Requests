import type { PullRequest, PullRequestReview } from '@/ResponsesTypes';
import type { QueryStore } from '@/stores/queryStore';
import { type Octokit } from 'octokit';

export function useOctokitWrapper(octokit: Octokit, store: QueryStore) {
	async function fetchPullRequests(
		owner: string,
		repo: string,
	): Promise<PullRequest[] | undefined> {
		const group = {
			owner: owner,
			repo: repo,
		};
		const groupString = JSON.stringify(group);
		const cachedData = store.get(groupString);
		if (cachedData !== undefined) {
			return Promise.resolve(cachedData as PullRequest[]);
		}

		return octokit.rest.pulls.list(group).then((response) => {
			const data = response.data as PullRequest[];
			store.save(groupString, data);
			return data;
		});
	}

	async function fetchPullRequestReviews(
		owner: string,
		repo: string,
		pull_number: number,
	): Promise<PullRequestReview[] | undefined> {
		const group = {
			owner: owner,
			repo: repo,
			pull_number: pull_number,
		};
		const groupString = JSON.stringify(group);
		const cachedData = store.get(groupString);
		if (cachedData !== undefined) {
			return Promise.resolve(cachedData as PullRequestReview[]);
		}

		return octokit.rest.pulls.listReviews(group).then((response) => {
			const data = response.data as PullRequestReview[];
			store.save(groupString, data);
			return data;
		});
	}

	return {
		fetchPullRequests,
		fetchPullRequestReviews,
	};
}
