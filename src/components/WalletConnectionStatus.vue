<script setup>
import { useOnboard } from '@web3-onboard/vue';
import { useWalletStore, useSettingsStore } from '@/stores';
import { useChains } from '@/composables/useChains';
import { chainIdToHex } from '@/utils/chains';

const walletStore = useWalletStore();
const settingsStore = useSettingsStore();
const { isChainMismatch } = useChains();
const { connectWallet, setChain, connectingWallet } = useOnboard();

const handleConnect = async () => {
    try {
        await connectWallet();
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
};

const handleSwitchChain = async () => {
    try {
        const hexChainId = chainIdToHex(settingsStore.currentAppChainId);
        await setChain({
            chainId: hexChainId,
            wallet: walletStore.walletLabel
        });
    } catch (error) {
        console.error('Failed to switch chain:', error);
    }
};
</script>

<template>
    <div v-if="!walletStore.isConnected" class="wallet-connection-status">
        <Message severity="warn" icon="pi pi-exclamation-triangle">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <strong>Wallet not connected</strong>
                    <p class="m-0 mt-2">Please connect your wallet to continue.</p>
                </div>
                <Button
                    label="Connect"
                    icon="pi pi-wallet"
                    :loading="connectingWallet"
                    class="flex-shrink-0 whitespace-nowrap"
                    severity="contrast"
                    variant="outlined"
                    @click="handleConnect"
                />
            </div>
        </Message>
    </div>

    <div v-else-if="isChainMismatch" class="wallet-connection-status">
        <Message severity="warn" icon="pi pi-exclamation-triangle">
            <div class="flex items-center justify-between gap-2">
                <div>
                    <strong>Network mismatch</strong>
                    <p class="m-0 mt-2">
                        Wallet network does not match the application network.
                        Please switch to {{ settingsStore.currentAppChain?.chainName }} network.
                    </p>
                </div>
                <Button
                    label="Switch"
                    icon="pi pi-refresh"
                    severity="contrast"
                    variant="outlined"
                    class="flex-shrink-0 whitespace-nowrap"
                    @click="handleSwitchChain"
                />
            </div>
        </Message>
    </div>
</template>
