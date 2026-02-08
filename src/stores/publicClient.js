import { defineStore } from 'pinia';
import { createPublicClient, http } from 'viem';
import { useSettingsStore } from './settings';
import { getChainById, getViemChain } from '@/utils/chains';

/**
 * PublicClient store для управления viem Public Client
 * Автоматически обновляет Public Client при изменении currentAppChainId
 * Кеширует клиенты по chainId для оптимизации
 * 
 * @example
 * ```js
 * import { usePublicClientStore } from '@/stores';
 * 
 * const publicClientStore = usePublicClientStore();
 * 
 * // Получить актуальный Public Client для текущей сети приложения
 * const client = publicClientStore.currentPublicClient;
 * 
 * // Использовать для чтения данных из блокчейна
 * if (client) {
 *   const blockNumber = await client.getBlockNumber();
 * }
 * 
 * // Получить Public Client для конкретной сети
 * const sepoliaClient = publicClientStore.getPublicClient('11155111');
 * ```
 */
export const usePublicClientStore = defineStore('publicClient', {
    state: () => ({
        /**
         * Кеш Public Client по chainId
         * @type {Map<string, import('viem').PublicClient>}
         */
        clientCache: new Map()
    }),

    getters: {
        /**
         * Получает актуальный Public Client для текущей сети приложения
         * @returns {import('viem').PublicClient|null} Public Client или null, если сеть не установлена
         */
        currentPublicClient() {
            const settingsStore = useSettingsStore();
            const chainId = settingsStore.currentAppChainId;
            
            if (!chainId) {
                return null;
            }

            return this.getPublicClient(chainId);
        }
    },

    actions: {
        /**
         * Получает Public Client для указанного chainId
         * Использует кеш, если клиент уже создан
         * @param {string} chainId - ID сети
         * @returns {import('viem').PublicClient|null} Public Client или null
         */
        getPublicClient(chainId) {
            if (!chainId) {
                return null;
            }

            if (this.clientCache.has(chainId)) {
                return this.clientCache.get(chainId);
            }

            const chainConfig = getChainById(chainId);
            if (!chainConfig || !chainConfig.rpcUrl) {
                return null;
            }

            const viemChain = getViemChain(chainId);

            const publicClient = createPublicClient({
                chain: viemChain,
                transport: http(chainConfig.rpcUrl)
            });

            this.clientCache.set(chainId, publicClient);

            return publicClient;
        },

        /**
         * Очищает кеш Public Client
         * Полезно при необходимости освободить память
         */
        clearCache() {
            this.clientCache.clear();
        },

        /**
         * Удаляет Public Client из кеша для указанного chainId
         * @param {string} chainId - ID сети
         */
        removeFromCache(chainId) {
            if (chainId) {
                this.clientCache.delete(chainId);
            }
        }
    },

    $persist: false
});
