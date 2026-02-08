import { createWalletClient, custom, getAddress } from 'viem';
import { useOnboard } from '@web3-onboard/vue';
import { useWalletStore, usePublicClientStore } from '@/stores';
import { getViemChain } from '@/utils/chains';
import { useToast } from 'primevue/usetoast';
import { eventBus, EVENTS } from '@/utils/eventBus';

/**
 * Composable для отправки транзакций через WalletClient
 * @returns {Object} { sendTransaction: Function }
 */
export function useSendTransaction() {
    const walletStore = useWalletStore();
    const publicClientStore = usePublicClientStore();
    const { connectedWallet } = useOnboard();
    const toast = useToast();

    /**
     * Отправляет транзакцию и ждет её выполнения
     * @param {Object} txData - Данные транзакции
     * @param {string} txName - Имя транзакции для события
     * @returns {Promise<string>} Hash транзакции
     */
    const sendTransaction = async (txData, txName) => {
        if (!walletStore.isConnected || !connectedWallet.value?.provider) {
            throw new Error('Wallet is not connected');
        }

        if (!walletStore.chainId) {
            throw new Error('Chain ID is not available');
        }

        const viemChain = getViemChain(walletStore.chainId);
        const walletClient = createWalletClient({
            chain: viemChain,
            transport: custom(connectedWallet.value.provider)
        });

        const addresses = await walletClient.getAddresses();
        if (!addresses || addresses.length === 0) {
            throw new Error('No account found in wallet');
        }
        const account = addresses[0];

        try {
            const txHash = await walletClient.sendTransaction({
                account,
                to: txData.to,
                data: txData.data || '0x',
                value: txData.value || 0n,
                gas: txData.gas || txData.gasLimit || undefined,
                gasPrice: txData.gasPrice || undefined,
                maxFeePerGas: txData.maxFeePerGas || undefined,
                maxPriorityFeePerGas: txData.maxPriorityFeePerGas || undefined
            });

            const publicClient = publicClientStore.currentPublicClient;
            if (!publicClient) {
                throw new Error('Public Client is not available for current chain');
            }

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash,
                timeout: 300_000 // 5 minutes
            });

            if (receipt.status === 'reverted') {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Transaction was reverted. Please try again.',
                    life: 5000
                });
                throw new Error('Transaction reverted');
            }

            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Transaction completed successfully.',
                life: 5000
            });

            eventBus.emit(EVENTS.TRANSACTION_SUCCESS, {
                name: txName
            });

            return txHash;
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error submitting the transaction. Please try again.',
                life: 5000
            });

            throw error;
        }
    };

    return {
        sendTransaction
    };
}
