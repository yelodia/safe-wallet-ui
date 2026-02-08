<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { blo } from 'blo';
import { useAccountsStore, useSettingsStore, usePublicClientStore } from '@/stores';
import { buildFullPredictedSafe, predictSafeAddress, findAvailableSaltNonce } from '@/utils/safe';
import AccountInfoBlock from '@/components/accounts/AccountInfoBlock.vue';
import CopyButton from '@/components/CopyButton.vue';

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

const router = useRouter();
const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const publicClientStore = usePublicClientStore();

const predictedSafe = ref(null);
const computedAddress = ref(null);
const recommendedSaltNonce = ref(null);
const isLoading = ref(false);

const showWarning = computed(() => {
    return !isLoading.value && recommendedSaltNonce.value && recommendedSaltNonce.value?.saltNonce !== predictedSafe.value?.safeDeploymentConfig?.saltNonce;
});

const buttonLabel = computed(() => {
    return showWarning.value ? 'Add existing' : 'Create';
});

const initialize = async () => {
    try {
        const owners = props.formData.owners.filter(o => o && o.trim());
        const minimalSafeAccountConfig = {
            owners,
            threshold: props.formData.threshold
        };

        const result = await buildFullPredictedSafe(
            publicClientStore.currentPublicClient,
            minimalSafeAccountConfig,
            0 
        );

        predictedSafe.value = result.data;

        const addressResult = await predictSafeAddress(
            publicClientStore.currentPublicClient,
            predictedSafe.value
        );

        computedAddress.value = addressResult.data;
        await checkSaltNonce();
    } catch (error) {}
};

const checkSaltNonce = async () => {
    isLoading.value = true;
    try {
        const result = await findAvailableSaltNonce(
            publicClientStore.currentPublicClient,
            predictedSafe.value
        );

        if (result.success) {
            recommendedSaltNonce.value = result.data;
        }
        isLoading.value = false;
    } catch (error) {
        isLoading.value = false;
    }
};

const handleUseRecommendedAddress = async () => {
    if (!recommendedSaltNonce.value) return;

    predictedSafe.value.safeDeploymentConfig.saltNonce = recommendedSaltNonce.value.saltNonce;
    computedAddress.value = recommendedSaltNonce.value.address;
};

const handleCreateAccount = () => {
    if (!computedAddress.value || !predictedSafe.value) {
        return;
    }

    accountsStore.addAccount(
        computedAddress.value,
        predictedSafe.value.safeAccountConfig,
        predictedSafe.value.safeDeploymentConfig
    );

    router.push(`/account/${computedAddress.value}`);
};

const handleBack = () => {
    emit('back');
};

watch(
    () => props.isActive,
    (newValue) => {
        if (newValue) {
            recommendedSaltNonce.value = null;
            initialize();
        }
    }
);

watch(
    () => settingsStore.currentAppChainId,
    () => {
        if (props.isActive) {
            initialize();
        }
    }
);
</script>

<template>
    <Card class="p-2">
        <template #content>
            <h3>Review Safe Account</h3>
            <div class="flex items-center gap-4 mb-8" v-if="computedAddress">
                <Avatar :image="blo(computedAddress)" shape="circle" size="large" />
                <span class="text-sm sm:text-base font-mono">{{ computedAddress }}</span>
                <CopyButton :value="computedAddress" />
            </div>

            <AccountInfoBlock
                v-if="predictedSafe"
                :predicted-safe="predictedSafe"
            />

            <Message 
                icon="pi pi-exclamation-triangle" 
                severity="warn" 
                class="mt-8"
                v-if="showWarning && recommendedSaltNonce"
            >
                A contract already exists at this address. Use a new address instead:
                <div class="mt-2 font-bold">{{ recommendedSaltNonce.address }}</div>
                <Button
                    label="Use new address"
                    class="mt-4"
                    icon="pi pi-check"
                    variant="outlined"
                    severity="contrast"
                    @click="handleUseRecommendedAddress"
                />
                
            </Message>

        <div class="flex mt-8 justify-between">
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                severity="secondary"
                @click="handleBack"
            />
            <Button
                :label="buttonLabel"
                icon="pi pi-check"
                :loading="isLoading"
                @click="handleCreateAccount"
                :disabled="isLoading || !computedAddress || !predictedSafe"
            />
        </div>

        </template>
    </Card>

</template>
