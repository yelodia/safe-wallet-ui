import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { persistPlugin } from '@/stores/plugins/persist';
import { useSettingsStore } from '@/stores';
import { configure } from 'vee-validate';
import { setupValidationRules } from '@/utils/validators';
import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { definePreset } from '@primeuix/themes';

import '@/assets/tailwind.css';
import '@/assets/styles.scss';

try {
    const savedSettings = localStorage.getItem('safe-ui:settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.darkMode === true) {
            document.documentElement.classList.add('app-dark');
        }
    }
} catch (error) {
    console.warn('Failed to load dark mode setting:', error);
}

const app = createApp(App);

configure({
  validateOnInput: false,
  validateOnChange: true,
  validateOnBlur: true,
  validateOnModelUpdate: false,
});

setupValidationRules();

const pinia = createPinia();
pinia.use(persistPlugin());

const MyPreset = definePreset(Aura, {
    semantic: {
                primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
                colorScheme: {
                    light: {
                        //surface: { 0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
                        surface: { 0: '#ffffff', 50: '#f1f5f9', 100: '#e2e8f0', 200: '#cbd5e1', 300: '#94a3b8', 400: '#64748b', 500: '#475569', 600: '#334155', 700: '#1e293b', 800: '#0f172a', 900: '#020617', 950: '#010813' },
                        primary: {
                            color: '{primary.400}',
                            contrastColor: '#ffffff',
                            hoverColor: '{primary.500}',
                            activeColor: '{primary.700}'
                        },
                        highlight: {
                            background: '{primary.50}',
                            focusBackground: '{primary.100}',
                            color: '{primary.700}',
                            focusColor: '{primary.800}'
                        },
                    },
                    dark: {
                        surface: { 0: '#ffffff', 50: '#f4f4f4', 100: '#e8e9e9', 200: '#d2d2d4', 300: '#bbbcbe', 400: '#a5a5a9', 500: '#8e8f93', 600: '#77787d', 700: '#616268', 800: '#4a4b52', 900: '#34343d', 950: '#1d1e27' },
                        primary: {
                            color: '{primary.400}',
                            contrastColor: '{surface.900}',
                            hoverColor: '{primary.300}',
                            activeColor: '{primary.200}'
                        },
                        highlight: {
                            background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                            focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                            color: 'rgba(255,255,255,.87)',
                            focusColor: 'rgba(255,255,255,.87)'
                        }
                    }
                }
    },

});

app.use(pinia);

const settingsStore = useSettingsStore();
settingsStore.initializeCurrentChain();

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
