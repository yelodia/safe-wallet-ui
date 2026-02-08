import { defineStore } from 'pinia';
import { getAddress } from 'viem/utils';
import { getChainById, normalizeChainId } from '@/utils/chains';

/**
 * Wallet store для централизованной работы с кошельком
 * Синхронизируется с web3-onboard и предоставляет нормализованные данные
 */
export const useWalletStore = defineStore('wallet', {
    state: () => ({
        isConnected: false,
        walletAddress: null,
        walletLabel: null,
        walletIcon: null,
        balance: null,
        chainId: null
    }),

    getters: {
        /**
         * Название текущей сети
         * @returns {string}
         */
        currentChainName: (state) => {
            if (!state.chainId) return 'Unknown';
            
            const chain = getChainById(state.chainId);
            return chain ? chain.chainName : 'Unknown';
        },

        /**
         * Логотип текущей сети
         * @returns {string}
         */
        currentChainLogo: (state) => {
            if (!state.chainId) {
                return '/images/chains/undefined.png';
            }
            const chain = getChainById(state.chainId);
            return chain?.logo || '/images/chains/undefined.png';
        },

        /**
         * Получает баланс нативного токена текущей сети
         * @returns {Object} { symbol: string, value: string, formatted: string }
         */
        primaryBalance: (state) => {
            const chain = state.chainId ? getChainById(state.chainId) : null;
            if (!chain) {
                return {
                    symbol: 'ETH',
                    value: '0',
                    formatted: '0'
                };
            }

            const symbol = chain.nativeCurrency.symbol;
            const valueStr = state.balance?.[symbol] || '0';
            const valueNumber = parseFloat(valueStr);

            if (Number.isNaN(valueNumber) || valueNumber === 0) {
                return {
                    symbol,
                    value: '0',
                    formatted: '0'
                };
            }

            const formatted = valueNumber.toFixed(5).replace(/\.?0+$/, '');

            return {
                symbol,
                value: valueStr,
                formatted
            };
        }
    },

    actions: {
        /**
         * Устанавливает состояние подключения кошелька
         * Нормализует данные (адрес в checksum формат, chainId из hex в decimal строку)
         * @param {boolean} isConnected - подключен ли кошелек
         * @param {string|null} walletAddress - адрес кошелька (может быть в lowercase)
         * @param {string|null} walletLabel - название кошелька (например, "MetaMask")
         * @param {string|number|null} chainId - ID сети (может быть hex '0x279f' или decimal)
         * @param {string|null} walletIcon - логотип кошелька (SVG строка или URL)
         * @param {Object|null} balance - баланс кошелька (объект вида { "ETH": "1234567890123456789" })
         */
        setWalletState(isConnected, walletAddress = null, walletLabel = null, chainId = null, walletIcon = null, balance = null) {
            this.isConnected = isConnected;
            this.walletAddress = walletAddress ? getAddress(walletAddress) : null;
            this.walletLabel = walletLabel;
            this.walletIcon = walletIcon;
            this.balance = balance;
            this.chainId = chainId ? normalizeChainId(chainId) : null;
        },

        /**
         * Сбрасывает состояние кошелька
         */
        resetWalletState() {
            this.isConnected = false;
            this.walletAddress = null;
            this.walletLabel = null;
            this.walletIcon = null;
            this.balance = null;
            this.chainId = null;
        }
    },

    $persist: false
});
