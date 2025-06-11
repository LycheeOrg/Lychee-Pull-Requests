import {
	APPROVED,
	CHANGES_REQUESTED,
	CONTRIBUTOR,
	type PullRequest,
	type PullRequestReview,
	type ReviewStatus,
	type User,
} from '@/ResponsesTypes';
import { ref } from 'vue';

export function useGetData(
	fetchPullRequests: (owner: string, repo: string) => Promise<PullRequest[] | undefined>,
	fetchPullRequestReviews: (
		owner: string,
		repo: string,
		pull_number: number,
	) => Promise<PullRequestReview[] | undefined>,
) {
	const pullRequestsData = ref<(PullRequest & ReviewStatus)[] | undefined>(undefined);

	async function getPrs(): Promise<void> {
		return fetchPullRequests('LycheeOrg', 'Lychee').then((data) => {
			pullRequestsData.value = data;
		});
	}

	async function getStatuses() {
		if (!pullRequestsData.value || pullRequestsData.value.length === 0) {
			console.warn('No pull requests available to fetch statuses for.');
			return;
		}

		pullRequestsData.value.forEach(async (pr, idx) => {
			await fetchPullRequestReviews('LycheeOrg', 'Lychee', pr.number)
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
				if (
					(review.state === APPROVED || review.state === CHANGES_REQUESTED) &&
					review.author_association === CONTRIBUTOR
				) {
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
				by: [],
			},
		};
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		Object.entries(statuses).forEach(([_, review]) => {
			if (review.status === APPROVED) {
				result.review!.approved = true;
			} else if (status === CHANGES_REQUESTED) {
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
