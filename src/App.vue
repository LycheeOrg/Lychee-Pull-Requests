<template>
	<Panel
		class="bg-transparent border-none"
		header="Lychee Pull Requests"
		:pt:header:class="'justify-center text-3xl font-bold mb-8'"
	>
		<div class="flex flex-col">
			<div class="flex justify-center text-left">
				<div v-if="data" class="flex flex-col gap-4">
					<div
						v-for="pr in data"
						:key="pr.id"
						:class="{
							'flex flex-wrap gap-y-0.5': true,
							'transition-opacity duration-100 ease-in-out opacity-50 hover:opacity-100':
								pr.draft,
						}"
					>
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
						<div
							v-if="!pr.draft"
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
						<div v-if="pr.draft" class="text-muted-color">
							{{ computeHowLongAgo(pr.created_at) }}
							<!-- <span>🫣</span> -->
						</div>
						<div class="text-muted-color text-xs w-full">
							<span class="text-muted-color-emphasis">#{{ pr.number }}</span> opened
							by
							<a :href="pr.user.html_url" class="text-muted-color-emphasis"
								><img :src="pr.user.avatar_url" class="rounded-full h-4 inline" />
								{{ pr.user.login }}</a
							>
							<span v-if="pr.base.ref !== 'master'" class="ml-2">
								&rArr;
								<span class="ml-2 text-primary-emphasis">{{ pr.base.ref }}</span>
							</span>
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

type PullRequest = {
	active_lock_reason: unknown;
	assignee: unknown;
	assignees: string[];
	author_association: string;
	auto_merge: null;
	body: string;
	closed_at: null;
	comments_url: string;
	commits_url: string;
	created_at: string;
	diff_url: string;
	draft: boolean;
	html_url: string;
	id: number;
	issue_url: string;
	labels: { color: string; id: number; description: string; name: string }[];
	locked: boolean;
	merge_commit_sha: string;
	merged_at: null;
	milestone: null;
	node_id: string;
	number: number;
	patch_url: string;
	requested_reviewers: [];
	review_comment_url: string;
	review_comments_url: string;
	state: 'open';
	statuses_url: string;
	title: string;
	updated_at: string;
	url: string;
	user: {
		login: string;
		id: number;
		node_id: string;
		avatar_url: string;
		gravatar_id: string;
		url: string;
		html_url: string;
		followers_url: string;
		following_url: string;
		gists_url: string;
		starred_url: string;
		subscriptions_url: string;
		organizations_url: string;
		repos_url: string;
		events_url: string;
		received_events_url: string;
		type: string;
		site_admin: boolean;
	};
	base: { ref: string };
};

const data = ref<PullRequest[] | undefined>(undefined);
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

async function getPrs() {
	octokit.rest.pulls
		.list({
			owner: 'LycheeOrg',
			repo: 'Lychee',
		})
		.then((response) => {
			data.value = response.data as unknown as PullRequest[];
			console.log('Pull requests fetched successfully:', data.value);
		})
		.catch((error) => {
			console.error('Error fetching pull requests:', error);
		});
	// const response = await fetch('https://api.github.com/repos/LycheeOrg/Lychee/pulls');
	// data.value = await response.json();
}

onMounted(() => {
	getPrs();
});
</script>
