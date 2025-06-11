import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';

import piniaPluginPersistedState from 'pinia-plugin-persistedstate';

import App from './App.vue';
import { definePreset } from '@primeuix/themes';
import type { Preset } from '@primeuix/themes/types';

const app = createApp(App);

const preset: Preset = {
	semantic: {
		primary: {
			50: '{sky.50}',
			100: '{sky.100}',
			200: '{sky.200}',
			300: '{sky.300}',
			400: '{sky.400}',
			500: '{sky.500}',
			600: '{sky.600}',
			700: '{sky.700}',
			800: '{sky.800}',
			900: '{sky.900}',
			950: '{sky.950}',
		},
	},
};

const MySuperSarvinPreset = definePreset(Aura, preset);

const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
app.use(pinia);
app.use(PrimeVue, {
	theme: {
		preset: MySuperSarvinPreset,
		options: {
			darkModeSelector: '.dark',
			cssLayer: {
				name: 'primevue',
				order: 'theme, base, primevue',
			},
		},
	},
});

app.directive('tooltip', Tooltip);
app.use(ToastService);

app.mount('#app');
