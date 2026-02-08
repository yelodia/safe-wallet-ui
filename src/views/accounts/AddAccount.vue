<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useForm, defineRule } from 'vee-validate';
import { useAccountsStore, useSettingsStore, usePublicClientStore } from '@/stores';
import { isContractDeployed, getPredictedSafeFromTransaction, validateSafeConfig } from '@/utils/safe';
import { useAllFieldsFilled } from '@/composables/useAllFieldsFilled';
import AccountInfoBlock from '@/components/accounts/AccountInfoBlock.vue';
import ValidationField from '@/components/ValidationField.vue';

const router = useRouter();
const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const publicClientStore = usePublicClientStore();

const predictedSafe = ref(null);
const isEditing = ref(false);

const { errors, values, resetForm, defineField, validateField } = useForm({
    initialValues: {
        address: '',
        txHash: ''
    }
});

defineRule('validateAddress', async (value) => {
    if (!value || !value.trim()) {
        return true;
    }

    const publicClient = publicClientStore.currentPublicClient;

    const isDeployed = await isContractDeployed(publicClient, value.trim());
    if (!isDeployed) {
        return 'Contract not found';
    }

    if (predictedSafe.value) {
        const isValid = await validateSafeConfig(
            publicClient,
            predictedSafe.value,
            value.trim()
        );
        if (!isValid) {
            return 'Contract is not valid';
        }
    }

    return true;
});

defineRule('validateTxHash', async (value) => {
    predictedSafe.value = null;
    if (!value || !value.trim()) {
        return true;
    }

    const publicClient = publicClientStore.currentPublicClient;

    const result = await getPredictedSafeFromTransaction(publicClient, value.trim());
    if (!result.success) {
        return 'Transaction is not valid';
    }

    predictedSafe.value = result.data;
    await validateField('address');

    return true;
});

const [address] = defineField('address');
const [txHash] = defineField('txHash');

const allFieldsFilled = useAllFieldsFilled(address, txHash);

const canShowAccountInfo = computed(() => 
    Object.keys(errors.value).length === 0 && 
    allFieldsFilled.value &&
    predictedSafe.value &&
    !isEditing.value
);

const handleAddAccount = () => {
    const account = predictedSafe.value.safeAccountConfig;
    const deploy = predictedSafe.value.safeDeploymentConfig;
    accountsStore.addAccount(address.value, account, deploy);
    router.push(`/account/${address.value}`);
};

const toggleEditing = (val) => {
    isEditing.value = val;
};

watch(() => settingsStore.currentAppChainId, () => {
    resetForm();
    predictedSafe.value = null;
});


</script>

<template>
    <div class="max-w-4xl mx-auto">
        <h1>Add Account</h1>

        <Card class="mt-4 p-2">
            <template #content>
                <Message severity="info" icon="pi pi-info-circle" class="mb-10">
                    Please provide both the Safe address and the transaction hash from when the Safe was created. <br> This is necessary to extract the Safe configuration.
                </Message>

                <ValidationField
                    name="address"
                    label="Safe Address"
                    validation="isAddress|validateAddress"
                    @input="toggleEditing(true)"
                    @blur="toggleEditing(false)"
                    @keyup.enter="toggleEditing(false)"
                />

                <ValidationField
                    name="txHash"
                    label="Transaction Hash"
                    validation="validateTxHash"
                    @input="toggleEditing(true)"
                    @blur="toggleEditing(false)"
                    @keyup.enter="toggleEditing(false)"
                />

                <div class="mt-10" >
                    <AccountInfoBlock v-if="canShowAccountInfo && predictedSafe" :predicted-safe="predictedSafe" />
                    <div class="flex justify-end">
                        <Button
                            label="Add"
                            :disabled="!canShowAccountInfo || !predictedSafe"
                            :loading="!canShowAccountInfo && !!values.txHash && !errors.txHash"
                            icon="pi pi-check"
                            @click="handleAddAccount"
                        />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
