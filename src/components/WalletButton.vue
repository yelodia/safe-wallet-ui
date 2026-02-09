<script setup>
import { ref } from 'vue';
import { useOnboard } from '@web3-onboard/vue';
import { useWalletStore, useSettingsStore } from '@/stores';
import { useChains } from '@/composables/useChains';
import { chainIdToHex } from '@/utils/chains';
import { formatAddress } from '@/composables/useFormatting';
import CopyButton from '@/components/CopyButton.vue';
import { blo } from 'blo';

const walletStore = useWalletStore();
const settingsStore = useSettingsStore();
const { isChainMismatch } = useChains();
const { connectWallet, disconnectWallet, connectingWallet, setChain } = useOnboard();
const popoverRef = ref(null);
const walletButtonRef = ref(null);

const handleConnect = async () => {
    try {
        await connectWallet();
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
};

const handleDisconnect = async () => {
    try {
        if (walletStore.walletLabel) {
            await disconnectWallet({ label: walletStore.walletLabel });
            popoverRef.value?.hide();
        }
    } catch (error) {
        console.error('Failed to disconnect wallet:', error);
    }
};

const togglePopover = (event) => {
    popoverRef.value?.toggle(event, walletButtonRef.value);
};

const handleSwitchChain = async () => {
    try {
        const hexChainId = chainIdToHex(settingsStore.currentAppChainId);
        await setChain({
            chainId: hexChainId,
            wallet: walletStore.walletLabel
        });
        popoverRef.value?.hide();
    } catch (error) {
        console.error('Failed to switch chain:', error);
    }
};
</script>

<template>
    <div ref="walletButtonRef" class="relative">
        <Button
            v-if="!walletStore.isConnected"
            label="Connect"
            size="large"
            icon="pi pi-wallet"
            :loading="connectingWallet"
            @click="handleConnect"
        />

        <template v-else>
            <Button 
                variant="outlined" 
                severity="secondary"
                size="small"
                @click="togglePopover"
            >
                <AvatarGroup>
                    <Avatar :image="walletStore.walletIcon" shape="circle" />
                    <Avatar :image="walletStore.currentChainLogo" shape="circle" />
                </AvatarGroup>
                <span class="text-black dark:text-white">
                    {{ formatAddress(walletStore.walletAddress) }}
                </span>
                <i class="text-xs/0! pi" :class="{'pi-chevron-down': !popoverRef?.visible, 'pi-chevron-up': popoverRef?.visible}"></i>
            </Button>
            
            <Badge
                v-if="isChainMismatch"
                value="!"
                severity="danger"
                size="small"
                class="wallet-button-badge text-white!"
            />
            
        </template>

        <Popover ref="popoverRef">
            <div class="p-2" v-if="walletStore.isConnected">
                <div class="flex gap-3 items-center">
                    <Avatar :image="blo(walletStore.walletAddress || '0x')" shape="circle"  />
                    <span>
                        {{ formatAddress(walletStore.walletAddress) }}
                    </span>
                    <CopyButton class="ml-auto" v-if="walletStore.walletAddress" :value="walletStore.walletAddress" />
                </div>
                <div class="wallet-info my-3">
                    <div class="flex items-center">
                        <span class="text-muted-color">Wallet:</span>
                        <span class="ml-auto">{{ walletStore.walletLabel }}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="text-muted-color">Balance:</span>
                        <span class="ml-auto">{{ walletStore.primaryBalance.formatted }} {{ walletStore.primaryBalance.symbol }}</span>
                    </div>
                </div>
                <Button v-if="isChainMismatch"
                    class="w-full my-2"
                    :label="`Switch to ${settingsStore.currentAppChain?.chainName || ''}`"
                    outlined
                    severity="contrast"
                    @click="handleSwitchChain"
                />
                <Button
                    class="w-full"
                    label="Disconnect"
                    severity="danger"
                    outlined
                    @click="handleDisconnect"
                />
            </div>

        </Popover>
    </div>
</template>

<style scoped lang="scss">
.wallet-info {
    border: 1px solid var(--surface-border);
    min-width: 240px;
    div {
        border-bottom: 1px solid var(--surface-border);
        padding: 0.5rem;
    }
    div:last-child {
        border-bottom: 0;
    }
}

.wallet-button-badge {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(40%, -40%);
}

</style>
