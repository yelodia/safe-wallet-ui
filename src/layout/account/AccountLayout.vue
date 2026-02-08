<script setup>
import { ref, onMounted, onUnmounted, watch, provide } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountsStore, usePublicClientStore, useSettingsStore } from '@/stores';
import { validateSafeConfig, isContractDeployed } from '@/utils/safe';
import { eventBus, EVENTS } from '@/utils/eventBus';

const route = useRoute();
const accountsStore = useAccountsStore();
const publicClientStore = usePublicClientStore();
const settingsStore = useSettingsStore();

const isValidationSuccess = ref(null);
const isDeployed = ref(null);

async function validateAccount() {
    const address = route.params.address;
    
    const accountData = accountsStore.getAccount(address);
    
    if (!accountData) {
        isValidationSuccess.value = false;
        return false;
    }
    
    const predictedSafe = {
        safeAccountConfig: accountData.account,
        safeDeploymentConfig: accountData.deploy
    };
    
    const publicClient = publicClientStore.currentPublicClient;
    
    const isValid = await validateSafeConfig(publicClient, predictedSafe, address);
    isValidationSuccess.value = isValid;
    
    return isValid;
}

async function checkDeployment() {
    const address = route.params.address;
    const publicClient = publicClientStore.currentPublicClient;

    isDeployed.value = null;
    
    const deployed = await isContractDeployed(publicClient, address);
    isDeployed.value = deployed;
    eventBus.emit(EVENTS.CONTRACT_DEPLOYED, { address, deployed });
}

async function initializeAccount() {
    const isValid = await validateAccount();
    
    if (isValid) {
        await checkDeployment();
    }
}

function handleTransactionSuccess(event) {
    if (event.name === 'contract_deploy') {
        isDeployed.value = true;
        eventBus.emit(EVENTS.CONTRACT_DEPLOYED, { address, deployed: true });
    }
}

provide('isDeployed', isDeployed);

onMounted(() => {
    initializeAccount();
    eventBus.on(EVENTS.TRANSACTION_SUCCESS, handleTransactionSuccess);
});

onUnmounted(() => {
    eventBus.off(EVENTS.TRANSACTION_SUCCESS, handleTransactionSuccess);
});

watch(
    () => settingsStore.currentAppChainId,
    () => {
        if (isValidationSuccess.value === true) {
            checkDeployment();
        }
    }
);

watch(
    () => route.path,
    () => {
        initializeAccount();
    }
);
</script>

<template>
    <div>
        <div v-if="!isValidationSuccess" class="max-w-4xl mx-auto">
            <Message severity="error" icon="pi pi-ban" size="large">
                Account is not valid
                <p>Account configuration does not match the specified address.</p>
            </Message>
            <img src="/pumpkin.svg" width="300" height="300" class="mx-auto mt-10">
        </div>
        
        <div v-else>
            <router-view />
        </div>
    </div>
</template>

