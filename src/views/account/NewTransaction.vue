<script setup>
import { ref, computed, inject, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getAddress } from 'viem';
import { useAccountsStore, useSettingsStore } from '@/stores';

import Step1TransactionForm from './Step1TransactionForm.vue';
import Step2Transaction from './Step2Transaction.vue';

const isDeployed = inject('isDeployed', ref(null));

const route = useRoute();
const accountsStore = useAccountsStore();
const address = computed(() => getAddress(route.params.address));
const settingsStore = useSettingsStore();

const pinataApiKey = computed(() => accountsStore.getPinataApiKey(address.value));
const hasPinataApiKey = computed(() => !!pinataApiKey.value);

const formData = ref({
    contractAddress: '',
    abi: '',
    selectedMethod: null,
    value: '',
    inputs: []
});

const activeStep = ref(1);

const handleNext = () => {
    activeStep.value = 2;
};

const handleBack = () => {
    activeStep.value = 1;
};

watch(
    () => settingsStore.currentAppChainId,
    () => {
        activeStep.value = 1;
    }
);

</script>

<template>
    <div class="max-w-4xl mx-auto">
        <h1>New Transaction</h1>

        <div v-if="isDeployed === false" class="deployment-message">
            <Message severity="warn" icon="pi pi-exclamation-triangle">
                <div class="font-bold"> Account is not active </div>
                <p>To create a transaction, you need to activate the account by deploying the contract to the network.</p>
                <RouterLink :to="`/account/${address}`">
                    <Button label="Go to config" icon="pi pi-arrow-left" severity="contrast" variant="outlined" />
                </RouterLink>
            </Message>
        </div>

        <div v-if="isDeployed === true && !hasPinataApiKey" class="pinata-message">
            <Message severity="warn" icon="pi pi-exclamation-triangle">
                <div class="font-bold">Pinata API key is required </div>
                <p>To configure it, click on "Pinata API key" in the sidebar and enter your JWT token.</p>
            </Message>
        </div>

        <Stepper 
            v-if="isDeployed === true && hasPinataApiKey" 
            v-model:value="activeStep" 
        >
            <StepList>
                <Step :value="1">Configure</Step>
                <Step :value="2">Review</Step>
            </StepList>
            <StepPanels>
                <StepPanel :value="1" class="rounded-xl">
                    <Step1TransactionForm 
                        v-model="formData" 
                        @next="handleNext" 
                    />
                </StepPanel>
                <StepPanel :value="2" class="rounded-xl">
                    <Step2Transaction 
                        :form-data="formData" 
                        :is-active="activeStep === 2"
                        @back="handleBack" 
                    />
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>
</template>

<style scoped>
:deep(.p-step) {
    pointer-events: none;
    cursor: default;
}
</style>
