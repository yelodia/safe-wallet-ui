<script setup>
import { ref, computed, nextTick } from 'vue';
import { useTimeAgo } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useSignSafeTransaction } from '@/composables/useSignSafeTransaction';
import { useSendTransaction } from '@/composables/useSendTransaction';
import { useChains } from '@/composables/useChains';
import { useAccountsStore, useWalletStore } from '@/stores';
import { getSafeTx, executeSafeTx } from '@/utils/safe/safePinata';
import TransactionDetails from '@/components/account/TransactionDetails.vue';

const props = defineProps({
    safeSDK: {
        type: Object,
        required: true
    },
    group: {
        type: Object,
        required: true
    },
    currentNonce: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    onFileAdded: {
        type: Function,
        default: null
    },
    onGroupRemoved: {
        type: Function,
        default: null
    },
    onFileRemoved: {
        type: Function,
        default: null
    },
    isLastGroup: {
        type: Boolean,
        default: false
    }
});

const toast = useToast();
const accountsStore = useAccountsStore();
const walletStore = useWalletStore();
const { isChainMismatch } = useChains();
const { signTransaction, isSigning } = useSignSafeTransaction();
const { sendTransaction } = useSendTransaction();

const safeTx = ref(null);
const abi = ref(null);
const isLoading = ref(false);
const isExpanded = ref(false);

const firstFile = computed(() => props.group.files?.[0] || null);

const methodName = computed(() => {
    return firstFile.value?.keyvalues?.method || 'Unknown';
});

const timeAgo = useTimeAgo(() => firstFile.value?.created_at, {
    showSecond: false,
    updateInterval: 30000
});

const signatureCount = computed(() => props.group.files?.length || 0);

const accountData = computed(() => accountsStore.getAccount(props.address));
const threshold = computed(() => accountData.value?.account?.threshold || 0);

const hasCurrentWalletSigned = computed(() => {
    if (!walletStore.walletAddress) return false;
    return props.group.files?.some(file => {
        const signer = file.keyvalues?.signer;
        return signer && signer.toLowerCase() === walletStore.walletAddress.toLowerCase();
    }) || false;
});

const hasEnoughSignatures = computed(() => {
    return signatureCount.value >= threshold.value;
});

const canConfirm = computed(() => {
    return walletStore.isConnected && 
           !isChainMismatch.value && 
           !hasCurrentWalletSigned.value && 
           !hasEnoughSignatures.value && 
           !isLoading.value && 
           !isSigning.value;
});

const canExecute = computed(() => {
    return walletStore.isConnected && 
           !isChainMismatch.value && 
           hasEnoughSignatures.value && 
           props.group.nonce === props.currentNonce && 
           !isLoading.value && 
           !isSigning.value;
});

const iconClass = computed(() => {
    if (isLoading.value) {
        return 'pi pi-spin pi-spinner';
    }
    if (isExpanded.value) {
        return 'pi pi-chevron-up';
    }
    return 'pi pi-chevron-down';
});

const baseTooltipMessage = computed(() => {
    if (!walletStore.isConnected) {
        return 'Please connect your wallet';
    }
    if (isChainMismatch.value) {
        return 'Please switch to the correct network';
    }
    return null;
});

const confirmTooltip = computed(() => {
    const baseMessage = baseTooltipMessage.value;
    if (baseMessage) return baseMessage;
    
    if (hasCurrentWalletSigned.value) {
        return 'You have already signed this transaction';
    }
    return '';
});

const executeTooltip = computed(() => {
    const baseMessage = baseTooltipMessage.value;
    if (baseMessage) return baseMessage;
    
    if (props.group.nonce > props.currentNonce) {
        return `Please submit transaction with nonce ${props.currentNonce} first`;
    }
    return '';
});

async function loadSafeTx() {
    if (safeTx.value) {
        return;
    }

    const jwt = accountsStore.getPinataApiKey(props.address);
    
    const result = await getSafeTx(props.safeSDK, jwt, firstFile.value.cid);
    
    if (result.success) {
        safeTx.value = result.data.safeTx;
        abi.value = result.data.abi;
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Something went wrong. Please try again.',
            life: 5000
        });
    }
}

async function handleRowClick() {
    if (isLoading.value) {
        return;
    }

    if (safeTx.value) {
        isExpanded.value = !isExpanded.value;
        return;
    }

    isLoading.value = true;
    
    await loadSafeTx();
    
    if (safeTx.value) {
        isExpanded.value = true;
    }
    
    isLoading.value = false;
}

async function handleConfirm() {
    isSigning.value = true;

    await loadSafeTx();
        
    if (!safeTx.value) {
        isSigning.value = false;
        return;
    }

    const signResult = await signTransaction({
        safeSDK: props.safeSDK,
        safeTx: safeTx.value,
        safeAddress: props.address,
        selectedMethod: abi.value
    });

    if (signResult.success && props.onFileAdded) {
        props.onFileAdded(signResult.data);
    }
}

async function handleExecute() {
    isSigning.value = true;

    await loadSafeTx();
        
    if (!safeTx.value) {
        isSigning.value = false;
        return;
    }

    const executeResult = await executeSafeTx(
        props.safeSDK,
        safeTx.value,
        props.group,
        accountData.value
    );

    if (!executeResult.success) {
        isSigning.value = false;
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to prepare transaction for execution.',
            life: 5000
        });
        return;
    }

    try {
        await sendTransaction(
            {
                to: props.address,
                data: executeResult.data,
                value: 0n
            },
            'safe_transaction'
        );

        isSigning.value = false;

        await nextTick();
        if (props.onGroupRemoved) {
            props.onGroupRemoved();
        }
    } catch (error) {
        isSigning.value = false;
    }
}

</script>

<template>
    <div class="mt-2 p-card">
        <div class="block-link px-4 py-3 rounded-xl" :class="{'active': isExpanded}" @click="handleRowClick">
            <div class="grid items-center grid-cols-[70px_2fr_70px_1fr] sm:grid-cols-[70px_2fr_1fr_70px_1fr] gap-3">
                <div>
                    #{{ group.nonce }}
                </div>
                <div class="font-bold truncate">
                    {{ methodName }}
                </div>
                <div class="text-muted-color whitespace-nowrap hidden sm:block">
                    {{ timeAgo }}
                </div>
                <div>
                    <Tag 
                        :severity="signatureCount >= threshold ? 'success' : 'secondary'" 
                        :icon="signatureCount >= threshold ? 'pi pi-check' : 'pi pi-clock'"
                        :value="`${signatureCount}/${threshold}`" 
                        rounded
                    />
                </div>
                <div class="flex justify-end items-center">
                    <Button
                        v-if="!hasEnoughSignatures"
                        :label="'Confirm'"
                        :disabled="!canConfirm"
                        :loading="isSigning"
                        @click.stop="handleConfirm"
                        v-tooltip="!canConfirm ? confirmTooltip : ''"
                    />
                
                    <Button
                        v-else
                        :label="'Execute'"
                        :disabled="!canExecute"
                        :loading="isSigning"
                        @click.stop="handleExecute"
                        v-tooltip="!canExecute ? executeTooltip : ''"
                    />

                    <i class="ml-3 text-muted-color" :class="iconClass" />
                </div>
            </div>
        </div>
        <div v-if="isExpanded && safeTx">
            <TransactionDetails
                :safeTx="safeTx"
                :abi="abi"
                :group="group"
                :address="address"
                :onFileRemoved="onFileRemoved"
                :onGroupRemoved="onGroupRemoved"
                :isLastGroup="isLastGroup"
            />
        </div>
    </div>
</template>
