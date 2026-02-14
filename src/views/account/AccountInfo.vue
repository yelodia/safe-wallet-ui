<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { inject } from 'vue';
import { useAccountsStore, useWalletStore, useSettingsStore } from '@/stores';
import { useSendTransaction } from '@/composables/useSendTransaction';
import { useChains } from '@/composables/useChains';
import { initSafe } from '@/utils/safe';
import { getAddress } from 'viem';
import { useOnboard } from '@web3-onboard/vue';
import { blo } from 'blo';
import CopyButton from '@/components/CopyButton.vue';
import WalletConnectionStatus from '@/components/WalletConnectionStatus.vue';
import { eventBus, EVENTS } from '@/utils/eventBus';

const route = useRoute();
const accountsStore = useAccountsStore();
const walletStore = useWalletStore();
const settingsStore = useSettingsStore();
const { sendTransaction } = useSendTransaction();
const { isChainMismatch } = useChains();
const { connectedWallet } = useOnboard();

const isDeployed = inject('isDeployed', null);

const address = computed(() => getAddress(route.params.address));

const accountData = computed(() => accountsStore.getAccount(address.value));

const predictedSafe = computed(() => {
    if (!accountData.value) return null;
    return {
        safeAccountConfig: accountData.value.account,
        safeDeploymentConfig: accountData.value.deploy
    };
});

const isDeploying = ref(false);

async function handleDeploy() {

    isDeploying.value = true;

    try {
        const { safeSDK, success, error } = await initSafe(connectedWallet.value?.provider, predictedSafe.value);
        
        if (!success || !safeSDK) {
            throw error || new Error('Failed to initialize SafeSDK');
        }

        const deploymentTx = await safeSDK.createSafeDeploymentTransaction();

        await sendTransaction(deploymentTx, 'contract_deploy');
        isDeploying.value = false;
    } catch (error) {
        console.error('Deploy error:', error);
        isDeploying.value = false;
    }
}

const canDeploy = computed(() => {
    return walletStore.isConnected && !isChainMismatch.value;
});

watch( isDeploying, (newValue) => {
    eventBus.emit(EVENTS.LOCK_CHAIN, newValue);
});

</script>

<template>
    <div class="max-w-4xl mx-auto">
        <h1>Account Details</h1>

        <Card class="p-2 mt-4">
            <template #content>
                <h4>Version</h4>
                {{ predictedSafe?.safeDeploymentConfig?.safeVersion }}

                <h4>Owners</h4>
                <div v-for="(owner, index) in predictedSafe?.safeAccountConfig?.owners" :key="index">
                    <div class="flex items-center gap-2 my-2">
                        <Avatar :image="blo(owner || '0x')" shape="circle" />
                        <span class="font-mono">{{ owner }}</span>
                        <CopyButton :value="owner" />
                    </div>
                </div>

                <h4>Threshold</h4>
                <span>{{ predictedSafe?.safeAccountConfig?.threshold }}/{{ (predictedSafe?.safeAccountConfig?.owners || []).length }}</span>
            
                <template v-if="predictedSafe?.safeAccountConfig?.fallbackHandler">
                    <h4>Fallback Handler</h4>
                    <p class="text-muted-color"> The fallback handler adds fallback logic for funtionality that may not be present in the Safe Account contract. </p>
                    <div class="flex items-center gap-2 mt-4">
                        <span class="font-mono">{{ predictedSafe?.safeAccountConfig?.fallbackHandler }}</span>
                        <CopyButton :value="predictedSafe?.safeAccountConfig?.fallbackHandler" />
                    </div>
                </template>

                <h4 class="inline-flex gap-4 items-center">
                    Pinata API key
                    <Tag v-if="accountsStore.getPinataApiKey(address)" icon="pi pi-check" severity="success" rounded value="Provided" />
                    <Tag v-else icon="pi pi-exclamation-triangle" severity="warn" rounded value="Not provided" />
                </h4>
                <p class="text-muted-color">
                    Pinata API key provides secure IPFS storage for your Safe transactions. 
                    It allows the application to store signed transaction data privately 
                    and retrieve pending transactions that require multiple signatures. 
                </p>
                <p v-if="!accountsStore.getPinataApiKey(address)">
                    To configure it, click on "Pinata API key" in the sidebar and enter your JWT token.
                </p>
            </template>
        </Card>

        <Card v-if="isDeployed === false" class="mt-8 p-2">
            <template #content>
                <h4>Account is not active</h4>
                <p>You need to activate the account by deploying the Safe to the network.</p>

                <WalletConnectionStatus />

                <Button
                    label="Deploy Contract"
                    icon="pi pi-send"
                    :loading="isDeploying"
                    :disabled="isDeploying"
                    v-if="canDeploy"
                    @click="handleDeploy"
                />

            </template>    
        </Card>

    </div>
</template>

