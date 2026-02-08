<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountsStore, usePublicClientStore, useSettingsStore } from '@/stores';
import { initSafe } from '@/utils/safe/initSafe';
import { pendingTransactions } from '@/utils/safe/safePinata';
import { getAddress } from 'viem';
import { eventBus, EVENTS } from '@/utils/eventBus';
import PendingTransaction from '@/components/account/PendingTransaction.vue';

const isDeployed = inject('isDeployed', ref(null));

const route = useRoute();
const accountsStore = useAccountsStore();
const publicClientStore = usePublicClientStore();
const settingsStore = useSettingsStore();

const address = computed(() => getAddress(route.params.address));
const pinataApiKey = computed(() => accountsStore.getPinataApiKey(address.value));
const hasPinataApiKey = computed(() => !!pinataApiKey.value);

const isLoading = ref(false);
const transactions = ref([]);
const safeSDK = shallowRef(null);
const currentNonce = ref(0);

const fetchTransactions = async () => {
    
    transactions.value = [];
    
    if (isDeployed.value !== true || !hasPinataApiKey.value || isLoading.value) {
        return;
    }

    isLoading.value = true;
    
    const initResult = await initSafe(publicClientStore.currentPublicClient, address.value);
    if (initResult.success) {
        safeSDK.value = initResult.safeSDK;
    } else {
        safeSDK.value = null;
        isLoading.value = false;
        return;
    }

    currentNonce.value = await safeSDK.value.getNonce();
        
    const chainId = settingsStore.currentAppChainId;
    const result = await pendingTransactions(safeSDK.value, pinataApiKey.value, chainId);

    transactions.value = result.data || [];
    isLoading.value = false;
};

function handleTransactionSuccess(event) {
    if (event.name === 'safe_transaction' && safeSDK.value) {
        safeSDK.value.getNonce().then(nonce => {
            currentNonce.value = nonce;
        });
    }
}

function handleFileAdded(groupIndex, uploadResult) {
    if (uploadResult && transactions.value[groupIndex]) {
        if (!transactions.value[groupIndex].files) {
            transactions.value[groupIndex].files = [];
        }
        transactions.value[groupIndex].files.push(uploadResult);
    }
}

function handleGroupRemoved(groupIndex) {
    if (groupIndex >= 0 && groupIndex < transactions.value.length) {
        transactions.value.splice(groupIndex, 1);
    }
}

function handleFileRemoved(groupIndex, fileId) {
    if (transactions.value[groupIndex]) {
        transactions.value[groupIndex].files = transactions.value[groupIndex].files.filter(f => f.id !== fileId);
    }
}

onMounted(() => {
    fetchTransactions();
    eventBus.on(EVENTS.TRANSACTION_SUCCESS, handleTransactionSuccess);
});

onUnmounted(() => {
    eventBus.off(EVENTS.TRANSACTION_SUCCESS, handleTransactionSuccess);
});

watch(
    [
        () => settingsStore.currentAppChainId,
        () => isDeployed.value,
        () => pinataApiKey.value
    ],
    () => {
        fetchTransactions();
    }
);

</script>

<template>
    <div class="max-w-7xl mx-auto">
        <h1 class="mb-4">
            Transactions
        </h1>

        <div v-if="isDeployed === null || isLoading" class="text-center mt-10">
            <i class="pi pi-spin pi-spinner text-5xl!"></i>
        </div>
        
        <div v-else>
            <Message severity="warn" icon="pi pi-exclamation-triangle" v-if="!hasPinataApiKey">
                <div class="font-bold">Pinata API key is required </div>
                <p>
                    To configure it, click on "Pinata API key" in the sidebar and enter your JWT token.
                </p>
            </Message>

            <div v-else-if="transactions.length === 0" class="empty-state">
                <h2>No pending transactions</h2>
                <p>Go to "New Transaction" to create a transaction that requires multiple signatures.</p>
            </div>
            
            <div v-else>
                <PendingTransaction
                    v-for="(group, index) in transactions"
                    :key="index"
                    :safeSDK="safeSDK"
                    :group="group"
                    :currentNonce="currentNonce"
                    :address="address"
                    :onFileAdded="(uploadResult) => handleFileAdded(index, uploadResult)"
                    :onGroupRemoved="() => handleGroupRemoved(index)"
                    :onFileRemoved="(fileId) => handleFileRemoved(index, fileId)"
                    :isLastGroup="index === transactions.length - 1"
                />
            </div>
        </div>
    </div>
</template>
