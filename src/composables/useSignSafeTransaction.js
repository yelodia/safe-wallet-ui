import { ref, watch } from 'vue';
import { useOnboard } from '@web3-onboard/vue';
import { useToast } from 'primevue/usetoast';
import { useAccountsStore, useSettingsStore } from '@/stores';
import { uploadSignedTx } from '@/utils/safe/safePinata';
import { eventBus, EVENTS } from '@/utils/eventBus';

/**
 * Composable для подписания и загрузки Safe транзакций
 * @returns {Object} { signTransaction: Function, isSigning: Ref<boolean> }
 */
export function useSignSafeTransaction() {
    const { connectedWallet } = useOnboard();
    const toast = useToast();
    const accountsStore = useAccountsStore();
    const settingsStore = useSettingsStore();
    
    const isSigning = ref(false);

    watch(isSigning, (newValue) => {
        eventBus.emit(EVENTS.LOCK_CHAIN, newValue);
    });

    /**
     * Подписывает Safe транзакцию и загружает её в Pinata
     * @param {Object} params - Параметры подписания
     * @param {import('@safe-global/protocol-kit').default} params.safeSDK - Инициализированный Safe SDK
     * @param {import('@safe-global/types-kit').SafeTransaction} params.safeTx - Safe транзакция для подписания
     * @param {string} params.safeAddress - Адрес Safe аккаунта
     * @param {Object} params.selectedMethod - Выбранный метод из ABI
     * @returns {Promise<{success: boolean, data?: any, error?: Error}>}
     */
    const signTransaction = async ({ safeSDK, safeTx, safeAddress, selectedMethod }) => {
        isSigning.value = true;

        try {
            const signedSafeSDK = await safeSDK.connect({
                provider: connectedWallet.value.provider
            });

            const signedTx = await signedSafeSDK.signTransaction(safeTx);

            const jwt = accountsStore.getPinataApiKey(safeAddress);
            const chainId = settingsStore.currentAppChainId;

            const uploadResult = await uploadSignedTx(safeSDK, signedTx, jwt, chainId, selectedMethod);

            if (uploadResult.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Transaction signed successfully',
                    life: 5000 
                });

                return {
                    success: true,
                    data: uploadResult.data
                };
            } else {
                throw uploadResult.error;
            }
        } catch (error) {
            console.error('Sign/upload error:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to sign transaction. Please try again.`,
                life: 5000
            });

            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        } finally {
            isSigning.value = false;
        }
    };

    return {
        signTransaction,
        isSigning
    };
}
