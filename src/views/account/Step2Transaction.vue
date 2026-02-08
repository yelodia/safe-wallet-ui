<script setup>
import { ref, computed, watch, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountsStore, useSettingsStore, usePublicClientStore, useWalletStore } from '@/stores';
import { useChains } from '@/composables/useChains';
import { useSignSafeTransaction } from '@/composables/useSignSafeTransaction';
import { initSafe } from '@/utils/safe/initSafe';
import { createSafeTx } from '@/utils/safe/safePinata';
import { getAddress, parseEther } from 'viem';
import TransactionInfoBlock from '@/components/account/TransactionInfoBlock.vue';
import WalletConnectionStatus from '@/components/WalletConnectionStatus.vue';

const props = defineProps({
    formData: {
        type: Object,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['back']);

const route = useRoute();
const router = useRouter();
const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const publicClientStore = usePublicClientStore();
const walletStore = useWalletStore();
const { isChainMismatch } = useChains();
const { signTransaction, isSigning } = useSignSafeTransaction();

const address = computed(() => getAddress(route.params.address));

const safeSDK = shallowRef(null);
const createSafeTxResult = ref(null);

const initializeSafeSDK = async () => {
    if (safeSDK.value) {
        return;
    }

    const initResult = await initSafe(publicClientStore.currentPublicClient, address.value);
    if (initResult.success) {
        safeSDK.value = initResult.safeSDK;
    } else {
        createSafeTxResult.value = {
            success: false,
            error: initResult.error
        };
    }
};

const createTransaction = async () => {
    createSafeTxResult.value = null;

    if (!safeSDK.value) {
        await initializeSafeSDK();
        if (!safeSDK.value) {
            return;
        }
    }

    const jwt = accountsStore.getPinataApiKey(address.value);

    const chainId = settingsStore.currentAppChainId;

    const formDataWithWei = {
        ...props.formData,
        value: props.formData.value && props.formData.value.trim() !== '' 
            ? parseEther(props.formData.value).toString() 
            : '0'
    };
    const result = await createSafeTx(safeSDK.value, jwt, chainId, formDataWithWei);
    createSafeTxResult.value = result;
};

const handleRetry = () => {
    createSafeTxResult.value = null;
    createTransaction();
};

const handleSign = async () => {
    const result = await signTransaction({
        safeSDK: safeSDK.value,
        safeTx: createSafeTxResult.value.data,
        safeAddress: address.value,
        selectedMethod: props.formData.selectedMethod
    });

    if (result.success) {
        router.push(`/account/${address.value}/transactions`);
    }
};

const handleBack = () => {
    createSafeTxResult.value = null;
    emit('back');
};

watch(
    () => props.isActive,
    async (newValue) => {
        if (newValue) {
            await createTransaction();
        }
    },
    { immediate: true }
);

watch(
    () => settingsStore.currentAppChainId,
    () => {
        safeSDK.value = null;
    }
);

</script>

<template>
    <Card class="p-2">
        <template #content>
            <h3>Review Transaction</h3>
            <div v-if="createSafeTxResult === null" class="flex justify-center items-center gap-2">
                <span>Creating transaction...</span>
            </div>
            
            <Message severity="error" icon="pi pi-ban" v-else-if="!createSafeTxResult.success">
                <div class="flex items-center justify-between gap-2">
                    <div>
                        <strong>Error creating transaction:</strong>
                        <p class="m-0 mt-2">{{ createSafeTxResult.error?.message || 'Unknown error' }}</p>
                    </div>
                    <Button
                        label="Try Again"
                        icon="pi pi-refresh"
                        class="flex-shrink-0 whitespace-nowrap"
                        severity="contrast"
                        variant="outlined"
                        @click="handleRetry"
                    />
                </div>
            </Message>

            <div v-else>
                <TransactionInfoBlock
                    :safe-tx="createSafeTxResult.data" 
                    :abi="props.formData.selectedMethod"
                />
                <WalletConnectionStatus />
            </div>

            <div class="flex mt-8 justify-between">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    @click="handleBack"
                />
                <Button
                    label="Sign"
                    icon="pi pi-check"
                    :loading="isSigning || createSafeTxResult === null"
                    :disabled="!createSafeTxResult?.success || !walletStore.isConnected || isChainMismatch || isSigning"
                    @click="handleSign"
                />
            </div>
        </template>
    </Card>
</template>

