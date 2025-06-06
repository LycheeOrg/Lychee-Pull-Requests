<template>
	<a :href="props.user.html_url" class="text-muted-color-emphasis">
		<img :src="props.user.avatar_url" class="rounded-full h-4 inline" /> {{ props.user.login }}
	</a>
</template>
<script setup lang="ts">
const props = defineProps<{
	user: {
		html_url: string;
		avatar_url: string;
		login: string;
	};
}>();
</script>
