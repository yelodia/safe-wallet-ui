/**
 * Централизованный экспорт всех Pinia stores
 * 
 * Использование:
 * ```js
 * import { useSettingsStore, useAccountsStore, useWalletStore } from '@/stores'
 * ```
 */

export { useSettingsStore } from './settings';
export { useAccountsStore } from './accounts';
export { useWalletStore } from './wallet';
export { usePublicClientStore } from './publicClient';