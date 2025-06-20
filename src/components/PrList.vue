<template>
	<div v-if="props.pullRequests" class="flex flex-col gap-2">
		<div
			v-for="pr in props.pullRequests"
			:key="pr.id"
			:class="{
				'flex justify-between gap-16': true,
				'transition-opacity duration-100 ease-in-out opacity-50 hover:opacity-100': pr.draft,
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
						<span class="ml-2 text-primary-emphasis">{{ pr.base.ref }}</span>
					</span>
				</div>
			</div>
			<div v-if="pr.review && pr.review.changes_requested" class="text-red-400 font-bold">Changes requested.</div>
			<div v-else-if="pr.review && pr.review.approved" class="flex flex-col">
				<div
					:class="{
						'text-right': true,
						'text-green-500': pr.review.approved && pr.review.code_owner_approved,
					}"
				>
					Approved
				</div>
				<div class="text-xs">
					by
					<UserTag v-for="(user, idx) in pr.review.by" :user="user" :key="`u${pr.id}-${idx}`" />
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
</template>
<script setup lang="ts">
import { Tag } from 'primevue';
import UserTag from './UserTag.vue';
import type { PullRequest, ReviewStatus } from '@/ResponsesTypes';

const props = defineProps<{
	pullRequests: (PullRequest & ReviewStatus)[];
}>();

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
</script>
