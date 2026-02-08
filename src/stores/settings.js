import { defineStore } from 'pinia'
import { getChainById } from '@/utils/chains'
import { CHAINS } from '@/config/chains'

/**
 * Settings store для хранения настроек приложения
 * Состояние автоматически синхронизируется с localStorage через persist plugin
 */
export const useSettingsStore = defineStore('settings', {
    state: () => ({
        darkMode: false,
        currentAppChainId: null
    }),

    getters: {
        /**
         * Проверяет, включена ли темная тема
         * @returns {boolean}
         */
        isDarkMode: (state) => state.darkMode,

        /**
         * Получает объект текущей сети приложения
         * После initializeCurrentChain() currentAppChainId всегда валиден
         * @returns {Object|undefined} Объект сети или undefined, если CHAINS пуст
         */
        currentAppChain: (state) => {
            if (!state.currentAppChainId) {
                return CHAINS.length > 0 ? CHAINS[0] : undefined;
            }
            return getChainById(state.currentAppChainId);
        }
    },

    actions: {
        /**
         * Переключает темную тему
         */
        toggleDarkMode() {
            this.darkMode = !this.darkMode
            this.applyDarkModeClass()
        },

        /**
         * Устанавливает темную тему
         * @param {boolean} value - true для темной темы, false для светлой
         */
        setDarkMode(value) {
            this.darkMode = value
            this.applyDarkModeClass()
        },

        /**
         * Применяет или удаляет класс app-dark к элементу html
         * @private
         */
        applyDarkModeClass() {
            if (this.darkMode) {
                document.documentElement.classList.add('app-dark')
            } else {
                document.documentElement.classList.remove('app-dark')
            }
        },

        /**
         * Устанавливает текущую сеть приложения
         * @param {string|null} chainId - ID сети приложения
         */
        setCurrentAppChainId(chainId) {
            this.currentAppChainId = chainId || null
        },

        /**
         * Инициализирует текущую сеть приложения
         * Проверяет валидность текущей сети и устанавливает первую, если:
         * - currentAppChainId не установлен
         * - текущая сеть не найдена в CHAINS (неизвестная сеть из localStorage)
         */
        initializeCurrentChain() {
            if (!this.currentAppChainId) {
                if (CHAINS.length > 0) {
                    this.setCurrentAppChainId(CHAINS[0].chainId);
                }
                return;
            }

            const currentChain = getChainById(this.currentAppChainId);
            if (!currentChain) {
                if (CHAINS.length > 0) {
                    this.setCurrentAppChainId(CHAINS[0].chainId);
                }
            }
        }
    },

    $persist: {
        key: 'settings',
        paths: ['darkMode', 'currentAppChainId']
    }
})
