<template>
	<Panel
		class="bg-transparent border-none"
		:header="formatOwnerRepo() + ' Pull Requests'"
		:pt:header:class="'justify-center text-4xl font-bold'"
	>
		<div class="flex flex-col max-w-4xl mx-auto gap-4 text-left">
			<div class="flex justify-between flex-wrap gap-4">
				<div></div>
				<div class="group text-muted-color text-center cursor-pointer w-4/5" @click="refresh">
					<span class="group-hover:hidden">Last update: {{ formattedUpdated }}</span>
					<span class="hidden group-hover:inline text-primary-emphasis">Click to clear cache.</span>
				</div>
				<i
					class="self-end flex pi pi-question-circle text-xl text-muted-color hover:text-primary-emphasis peer cursor-help"
				></i>
				<div
					class="w-full text-muted-color flex flex-col gap-4 max-h-0 overflow-y-hidden peer-hover:max-h-dvh hover:max-h-dvh transition-all duration-1000 ease-in-out"
				>
					<p>
						The support of stacked PR on the GitHub pull request page is pretty much non-existent. This page
						attempts to provide a better way to visualize them.
					</p>
					<p>
						A stack is automatically recognized by following the branch naming-convention
						<span class="text-sm font-mono text-muted-color-emphasis">feature-name/pr-name</span>: all the
						pull requests that start with the same
						<span class="text-sm font-mono text-muted-color-emphasis">feature-name/</span> are part of the
						same stack. All other pull requests are considered standalone.
					</p>
					<p>
						You can also use this page for your projects by adding
						<span class="text-sm font-mono text-muted-color-emphasis">#&lt;owner&gt;/&lt;repo&gt;</span>
						at the end of the url.
					</p>
				</div>
			</div>
			<template v-if="pullRequests">
				<template v-if="pullRequests.length === 0">
					<p class="text-center text-muted-color">No active pull requests.</p>
				</template>
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
import { onMounted } from 'vue';
import { Panel } from 'primevue';
import { type PullRequest } from './ResponsesTypes.ts';
import { useSplitter } from './composables/splitter';
import { computed } from 'vue';
import PrList from './components/PrList.vue';
import { useQueryStore } from './stores/queryStore';
import { useOctokitWrapper } from './composables/octokitWrapper';
import { useGetData } from './composables/getData';
import { storeToRefs } from 'pinia';

const queryStore = useQueryStore();
const { updated } = storeToRefs(queryStore);
const octokit = new Octokit();

const { fetchPullRequests, fetchPullRequestReviews } = useOctokitWrapper(octokit, queryStore);
const { pullRequestsData, getPrs, getStatuses } = useGetData(fetchPullRequests, fetchPullRequestReviews);

const { spliter } = useSplitter();
const pullRequests = computed(() => {
	if (!pullRequestsData.value) return undefined;
	return spliter(pullRequestsData.value, prToGroup, prToGroup);
});
function prToGroup(pr: PullRequest): string {
	if (!pr.head.ref.includes('/')) {
		return 'standalone';
	}
	// select the part before the first dash
	return pr.head.ref.split('/')[0] || 'standalone';
}

function allDrafts(prs: PullRequest[]): boolean {
	return prs.every((pr) => pr.draft);
}

const formattedUpdated = computed(() => {
	if (!updated.value) return '';
	const date = new Date(updated.value);
	return (
		date.getDate() +
		'/' +
		(date.getMonth() + 1) +
		'/' +
		date.getFullYear() +
		' ' +
		date.getHours() +
		':' +
		date.getMinutes()
	);
});

function getOwnerRepo(): { owner: string; repo: string } {
	const search = window.location.hash;
	const [owner, repo] = search.replace('#', '').split('/');
	return {
		owner: owner || 'LycheeOrg',
		repo: repo || 'Lychee',
	};
}

const { owner, repo } = getOwnerRepo();

function formatOwnerRepo(): string {
	if (owner === 'LycheeOrg' && repo === 'Lychee') {
		return 'Lychee';
	}
	return `${owner}/${repo}`;
}

async function refresh() {
	queryStore.reset();
	pullRequestsData.value = undefined;
	await getPrs(owner, repo);
	getStatuses(owner, repo);
}

onMounted(async () => {
	await getPrs(owner, repo);
	getStatuses(owner, repo);
});
</script>
