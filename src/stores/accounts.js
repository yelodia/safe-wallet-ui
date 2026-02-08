import { defineStore } from 'pinia';
import { getAddress, isAddress } from 'viem/utils';

/**
 * Accounts store для управления Safe аккаунтами
 * Состояние автоматически синхронизируется с localStorage через persist plugin
 */
export const useAccountsStore = defineStore('accounts', {
    state: () => ({
        accounts: {}
    }),

    getters: {
        /**
         * Возвращает массив аккаунтов в формате [{ address, account, deploy }]
         * @returns {Array}
         */
        accountsList: (state) => {
            return Object.entries(state.accounts).map(([address, data]) => ({
                address,
                account: data.account,
                deploy: data.deploy
            }));
        },

        /**
         * Проверяет, есть ли аккаунты
         * @returns {boolean}
         */
        hasAccounts: (state) => {
            return Object.keys(state.accounts).length > 0;
        },

        /**
         * Получает Pinata API ключ для аккаунта
         * @param {string} address - Адрес аккаунта
         * @returns {string|null} API ключ или null
         */
        getPinataApiKey: (state) => (address) => {
            if (!address || !isAddress(address)) return null;
            const normalizedAddress = getAddress(address.toLowerCase());
            const accountData = state.accounts[normalizedAddress];
            return accountData?.pinataApikey || null;
        }
    },

    actions: {
        /**
         * Добавляет аккаунт
         * @param {string} address - Адрес аккаунта (будет нормализован)
         * @param {Object} accountData - Данные аккаунта (safeAccountConfig)
         * @param {Object} deployData - Данные развертывания (safeDeploymentConfig)
         */
        addAccount(address, accountData, deployData) {
            if (!address) {
                throw new Error('Address is required');
            }
            const normalizedAddress = getAddress(address.toLowerCase());
            this.accounts[normalizedAddress] = {
                account: accountData,
                deploy: deployData,
                pinataApikey: ''
            };
        },

        /**
         * Удаляет аккаунт
         * @param {string} address - Адрес аккаунта
         */
        removeAccount(address) {
            if (!address) return;
            const normalizedAddress = getAddress(address.toLowerCase());
            delete this.accounts[normalizedAddress];
        },

        /**
         * Получает аккаунт по адресу
         * @param {string} address - Адрес аккаунта
         * @returns {Object|null} Объект с account и deploy или null
         */
        getAccount(address) {
            if (!address || !isAddress(address)) return null;
            const normalizedAddress = getAddress(address.toLowerCase());
            return this.accounts[normalizedAddress] || null;
        },

        /**
         * Обновляет Pinata API ключ для аккаунта
         * Сохраняет существующие account и deploy
         * @param {string} address - Адрес аккаунта (будет нормализован)
         * @param {string} apiKey - Pinata API ключ (JWT токен)
         */
        updateAccount(address, apiKey) {
            if (!address) {
                throw new Error('Address is required');
            }
            const normalizedAddress = getAddress(address.toLowerCase());
            if (!this.accounts[normalizedAddress]) {
                throw new Error('Account not found');
            }
            this.accounts[normalizedAddress] = {
                ...this.accounts[normalizedAddress],
                pinataApikey: apiKey || ''
            };
        },

        /**
         * Устанавливает Pinata API ключ для аккаунта
         * @param {string} address - Адрес аккаунта (будет нормализован)
         * @param {string} apiKey - Pinata API ключ (JWT токен)
         */
        setPinataApiKey(address, apiKey) {
            if (!address) {
                throw new Error('Address is required');
            }
            const normalizedAddress = getAddress(address.toLowerCase());
            if (!this.accounts[normalizedAddress]) {
                throw new Error('Account not found');
            }
            this.accounts[normalizedAddress] = {
                ...this.accounts[normalizedAddress],
                pinataApikey: apiKey || ''
            };
        }
    },

    $persist: {
        paths: ['accounts'],
        key: 'accounts',
        flat: true
    }
});
