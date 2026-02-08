import { computed, reactive } from 'vue';
import { useSettingsStore } from '@/stores';

const layoutState = reactive({
    mobileMenuActive: false
});

export function useLayout() {
    const settingsStore = useSettingsStore();

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            settingsStore.toggleDarkMode();
            return;
        }

        document.startViewTransition(() => {
            settingsStore.toggleDarkMode();
        });
    };

    const toggleMenu = () => {
        layoutState.mobileMenuActive = !layoutState.mobileMenuActive;
    };

    const hideMobileMenu = () => {
        layoutState.mobileMenuActive = false;
    };

    const isDarkTheme = computed(() => settingsStore.isDarkMode);

    return {
        layoutState,
        isDarkTheme,
        toggleDarkMode,
        toggleMenu,
        hideMobileMenu
    };
}
