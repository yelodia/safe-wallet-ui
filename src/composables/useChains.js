/**
 * Composable для работы с сетями в Vue компонентах
 * Реэкспортирует утилиты из utils/chains.js для удобного использования
 */

import { computed } from 'vue';
import {
    getAllChains,
    getChainById,
    getChainsByTestnet,
    getMainnetChains,
    getTestnetChains,
    convertToWeb3OnboardFormat
} from '@/utils/chains';
import { useWalletStore, useSettingsStore } from '@/stores';

/**
 * Composable для работы с сетями
 * @returns {Object} Объект с функциями для работы с сетями
 */
export function useChains() {
    const walletStore = useWalletStore();
    const settingsStore = useSettingsStore();

    /**
     * Проверяет, не совпадает ли сеть кошелька с сетью приложения
     * @returns {boolean} true если сети не совпадают и кошелек подключен
     */
    const isChainMismatch = computed(() => {
        if (!walletStore.isConnected || !walletStore.chainId || !settingsStore.currentAppChainId) {
            return false;
        }
        return walletStore.chainId !== settingsStore.currentAppChainId;
    });

    return {
        getAllChains,
        getChainById,
        getChainsByTestnet,
        getMainnetChains,
        getTestnetChains,
        convertToWeb3OnboardFormat,
        isChainMismatch
    };
}
