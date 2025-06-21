import {
	APPROVED,
	CHANGES_REQUESTED,
	type PullRequest,
	type PullRequestReview,
	type ReviewStatus,
	type User,
} from '@/ResponsesTypes';
import { ref } from 'vue';
import { useOwnerRepo } from './getOwnerRepo';

const { getReviewers } = useOwnerRepo();

export function useGetData(
	fetchPullRequests: (owner: string, repo: string) => Promise<PullRequest[] | undefined>,
	fetchPullRequestReviews: (
		owner: string,
		repo: string,
		pull_number: number,
	) => Promise<PullRequestReview[] | undefined>,
) {
	const pullRequestsData = ref<(PullRequest & ReviewStatus)[] | undefined>(undefined);

	async function getPrs(owner: string, repo: string): Promise<void> {
		return fetchPullRequests(owner, repo).then((data) => {
			pullRequestsData.value = data;
		});
	}

	async function getStatuses(owner: string, repo: string): Promise<void> {
		if (!pullRequestsData.value || pullRequestsData.value.length === 0) {
			console.warn('No pull requests available to fetch statuses for.');
			return;
		}

		pullRequestsData.value.forEach(async (pr, idx) => {
			await fetchPullRequestReviews(owner, repo, pr.number)
				.then((data) => {
					if (!pullRequestsData.value) {
						console.warn('pullRequestsData.value is undefined, cannot update review status.');
						return;
					}
					if (!data) {
						console.warn(`No review data available for ${pr.number}.`);
						return;
					}

					pullRequestsData.value[idx].review = extractStatusForPr(data).review;
				})
				.catch((error) => console.error(`Error fetching pull request reviews for PR #${pr.number}:`, error));
		});
	}

	function extractStatusForPr(reviews: PullRequestReview[]): ReviewStatus {
		// Loop through the reviews.
		// Ignore all the reviews that are not from the contributors.
		const statuses = reviews.reduce(
			(acc, review) => {
				if (review.state === APPROVED || review.state === CHANGES_REQUESTED) {
					acc[review.user.login] = { status: review.state, user: review.user };
				}
				return acc;
			},
			{} as Record<string, { status: string; user: User }>,
		);

		const result: ReviewStatus = {
			review: {
				approved: false,
				changes_requested: false,
				code_owner_approved: false,
				by: [],
			},
		};

		const constributors = getReviewers();

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		Object.entries(statuses).forEach(([_, review]) => {
			if (
				review.status === APPROVED &&
				(constributors.length === 0 || constributors.includes(review.user.login))
			) {
				result.review!.approved = true;
				result.review!.code_owner_approved = true;
			} else if (review.status === APPROVED) {
				result.review!.approved = true;
			} else if (review.status === CHANGES_REQUESTED) {
				result.review!.changes_requested = true;
			}
			result.review!.by.push(review.user);
		});
		return result;
	}

	return {
		pullRequestsData,
		getPrs,
		getStatuses,
	};
}
