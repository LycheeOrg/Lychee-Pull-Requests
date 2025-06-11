<template>
	<Panel
		class="bg-transparent border-none"
		header="Lychee Pull Requests"
		:pt:header:class="'justify-center text-4xl font-bold'"
	>
		<div class="flex flex-col max-w-4xl mx-auto gap-4 text-left">
			<div class="group mb-4 text-muted-color text-center cursor-pointer" @click="refresh">
				<span class="group-hover:hidden">Last update: {{ formattedUpdated }}</span>
				<span class="hidden group-hover:inline text-primary-emphasis">Click to clear cache.</span>
			</div>
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

async function refresh() {
	queryStore.reset();
	pullRequestsData.value = undefined;
	await getPrs();
	getStatuses();
}

onMounted(async () => {
	await getPrs();
	getStatuses();
});
</script>
