<template>
	<Panel
		class="bg-transparent border-none"
		header="Lychee Pull Requests"
		:pt:header:class="'justify-center text-4xl font-bold mb-8'"
	>
		<div class="flex flex-col max-w-4xl mx-auto gap-4 text-left">
			<template v-if="pullRequests">
				<template v-if="pullRequests.length === 1">
					<PrList v-if="pullRequests" :pull-requests="pullRequests[0].data" />
				</template>
				<template v-else>
					<div v-for="(group, idx) in pullRequests" :key="idx" class="group">
						<div
							:class="{
								'opacity-50 group-hover:opacity-100 transition-opacity duration-100 ease-in-out':
									allDrafts(group.data),
								'mb-4 text-xl capitalize font-bold text-primary-emphasis border-b border-dashed border-surface-400': true,
							}"
						>
							{{ group.header }}
						</div>
						<PrList :pull-requests="group.data" />
					</div>
				</template>
			</template>
			<div v-else>
				<p class="text-center text-primary-emphasis">Loading...</p>
			</div>
		</div>
	</Panel>
</template>

<script setup lang="ts">
import { Octokit } from 'octokit';
import { ref } from 'vue';
import { onMounted } from 'vue';
import { Panel } from 'primevue';
import {
	type PullRequest,
	type PullRequestReview,
	type ReviewStatus,
	type User,
	APPROVED,
	CHANGES_REQUESTED,
	CONTRIBUTOR,
} from './ResponsesTypes.ts';
import { useSplitter } from './composables/splitter';
import { computed } from 'vue';
import PrList from './components/PrList.vue';

const { spliter } = useSplitter();
const pullRequestsData = ref<(PullRequest & ReviewStatus)[] | undefined>(undefined);
const pullRequests = computed(() => {
	if (!pullRequestsData.value) return undefined;
	return spliter(pullRequestsData.value, prToGroup, prToGroup);
});
const octokit = new Octokit();

function prToGroup(pr: PullRequest): string {
	if (!pr.head.ref.includes('/')) {
		return 'standalone';
	}
	// select the part before the first dash
	return pr.head.ref.split('/')[0] || 'standalone';
}

async function getPrs(): Promise<void> {
	return octokit.rest.pulls
		.list({
			owner: 'LycheeOrg',
			repo: 'Lychee',
		})
		.then((response) => {
			pullRequestsData.value = response.data as unknown as PullRequest[];
		})
		.catch((error) => {
			console.error('Error fetching pull requests:', error);
		});
}

async function getStatuses() {
	if (!pullRequestsData.value || pullRequestsData.value.length === 0) {
		console.warn('No pull requests available to fetch statuses for.');
		return;
	}

	pullRequestsData.value.forEach(async (pr, idx) => {
		await octokit.rest.pulls
			.listReviews({
				owner: 'LycheeOrg',
				repo: 'Lychee',
				pull_number: pr.number, // Use the pull request number from the fetched PRs
			})
			.then((response) => {
				console.log(
					`Pull request reviews for PR #${pr.number} fetched successfully:`,
					response.data,
				);
				if (!pullRequestsData.value) {
					console.warn(
						'pullRequestsData.value is undefined, cannot update review status.',
					);
					return;
				}

				pullRequestsData.value[idx].review = extractStatusForPr(
					response.data as PullRequestReview[],
				).review;
			})
			.catch((error) => {
				console.error(`Error fetching pull request reviews for PR #${pr.number}:`, error);
			});
	});
}

function allDrafts(prs: PullRequest[]): boolean {
	return prs.every((pr) => pr.draft);
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
	Object.entries(statuses).forEach(([_no, review]) => {
		if (review.status === APPROVED) {
			result.review!.approved = true;
		} else if (status === CHANGES_REQUESTED) {
			result.review!.changes_requested = true;
		}
		result.review!.by.push(review.user);
	});
	return result;
}

onMounted(async () => {
	await getPrs();
	getStatuses();
});
</script>
