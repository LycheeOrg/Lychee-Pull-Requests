<template>
	<Panel
		class="bg-transparent border-none"
		header="Lychee Pull Requests"
		:pt:header:class="'justify-center text-3xl font-bold mb-8'"
	>
		<div class="flex flex-col">
			<div class="flex justify-center text-left">
				<div v-if="pullRequests" class="flex flex-col gap-2">
					<div
						v-for="pr in pullRequests"
						:key="pr.id"
						:class="{
							'flex justify-between gap-16': true,
							'transition-opacity duration-100 ease-in-out opacity-50 hover:opacity-100':
								pr.draft,
						}"
					>
						<div class="flex flex-col">
							<div class="flex items-center gap-2 grow-1">
								<a
									:href="pr.html_url"
									target="_blank"
									:class="{
										'font-bold hover:text-sky-400': true,
										'text-muted-color': pr.draft,
									}"
								>
									{{ pr.title }}
								</a>
								<Tag
									v-for="label in pr.labels"
									:value="label.name"
									:key="`${label.id}`"
									v-tooltip="label.description"
									:pt:label:class="'text-2xs'"
									:dt="{
										padding: '0.15rem 0.5rem',
									}"
									:style="{
										backgroundColor: `#${label.color}`,
										color: getFrontColor(`#${label.color}`),
									}"
								></Tag>
							</div>

							<div class="text-muted-color text-xs w-full">
								<span class="text-muted-color-emphasis">#{{ pr.number }}</span>
								opened by <UserTag :user="pr.user" />
								<span v-if="pr.base.ref !== 'master'" class="ml-2">
									&rArr;
									<span class="ml-2 text-primary-emphasis">{{
										pr.base.ref
									}}</span>
								</span>
							</div>
						</div>
						<div
							v-if="pr.review && pr.review.changes_requested"
							class="text-red-400 font-bold"
						>
							Changes requested.
						</div>
						<div v-else-if="pr.review && pr.review.approved" class="flex flex-col">
							<div class="text-green-500 text-right">Approved</div>
							<div class="text-xs">
								by
								<UserTag
									v-for="(user, idx) in pr.review.by"
									:user="user"
									:key="`u${pr.id}-${idx}`"
								/>
							</div>
						</div>
						<div
							v-else-if="!pr.draft"
							:class="{
								'shrink-1': true,
								'text-orange-400': !pr.draft && isMoreThanXdays(pr.created_at, 7),
								'text-red-400': !pr.draft && isMoreThanXdays(pr.created_at, 14),
								'': pr.draft,
							}"
						>
							{{ computeHowLongAgo(pr.created_at) }}
							<!-- <span v-if="isMoreThanXdays(pr.created_at, 30)">😭</span>
							<span v-else-if="isMoreThanXdays(pr.created_at, 14)">😢</span>
							<span v-else-if="isMoreThanXdays(pr.created_at, 7)">🥹</span>
							<span v-else-if="isMoreThanXdays(pr.created_at, 2)">🙂</span>
							<span v-else>😄</span> -->
						</div>
						<div v-else-if="pr.draft" class="text-muted-color">
							{{ computeHowLongAgo(pr.created_at) }}
							<!-- <span>🫣</span> -->
						</div>
					</div>
				</div>
				<div v-else>
					<p>Loading...</p>
				</div>
			</div>
		</div>
	</Panel>
</template>

<script setup lang="ts">
import { Octokit } from 'octokit';
import { ref } from 'vue';
import { onMounted } from 'vue';
import Tag from 'primevue/tag';
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
import UserTag from './components/UserTag.vue';

const pullRequests = ref<(PullRequest & ReviewStatus)[] | undefined>(undefined);
const octokit = new Octokit();

function colorIsDarkSimple(bgColor: string): boolean {
	// Simple check for dark color based on luminance
	const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
	const r = parseInt(color.substring(0, 2), 16); // hexToR
	const g = parseInt(color.substring(2, 4), 16); // hexToG
	const b = parseInt(color.substring(4, 6), 16); // hexToB
	return r * 0.299 + g * 0.587 + b * 0.114 <= 186;
}

function getFrontColor(bgColor: string): string {
	if (colorIsDarkSimple(bgColor)) {
		return '#ffffff'; // white for dark backgrounds
	}
	return '#000000'; // black for light backgrounds
}

function computeHowLongAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

function isMoreThanXdays(dateString: string, x: number): boolean {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	return days > x;
}

async function getPrs(): Promise<void> {
	return octokit.rest.pulls
		.list({
			owner: 'LycheeOrg',
			repo: 'Lychee',
		})
		.then((response) => {
			pullRequests.value = response.data as unknown as PullRequest[];
		})
		.catch((error) => {
			console.error('Error fetching pull requests:', error);
		});
}

async function getStatuses() {
	if (!pullRequests.value || pullRequests.value.length === 0) {
		console.warn('No pull requests available to fetch statuses for.');
		return;
	}

	pullRequests.value.forEach(async (pr, idx) => {
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
				if (!pullRequests.value) {
					console.warn('pullRequests.value is undefined, cannot update review status.');
					return;
				}

				pullRequests.value[idx].review = extractStatusForPr(
					response.data as PullRequestReview[],
				).review;
			})
			.catch((error) => {
				console.error(`Error fetching pull request reviews for PR #${pr.number}:`, error);
			});
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
