<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAccountsStore } from '@/stores';
import { validatePinataApiKey } from '@/utils/pinata';

const props = defineProps({
    address: {
        type: String,
        required: true
    }
});

const accountsStore = useAccountsStore();
const popoverRef = ref(null);
const pinataButtonRef = ref(null);
const apiKeyInput = ref('');
const validationError = ref('');
const isValidating = ref(false);

const currentApiKey = computed(() => {
    return accountsStore.getPinataApiKey(props.address) || '';
});

watch(() => currentApiKey.value, (newValue) => {
    apiKeyInput.value = newValue || '';
}, { immediate: true });

const handleSetApiKey = async () => {
    if(isValidating.value) return;

    validationError.value = '';
    isValidating.value = true;

    try {
        const result = await validatePinataApiKey(apiKeyInput.value);
        
        if (result.valid) {
            accountsStore.setPinataApiKey(props.address, apiKeyInput.value);
            popoverRef.value?.hide();
        } else {
            validationError.value = result.error || 'Invalid API key';
        }
    } catch (error) {
        validationError.value = error.message || 'Failed to validate API key';
    } finally {
        isValidating.value = false;
    }
};

const handleClear = () => {
    apiKeyInput.value = '';
    validationError.value = '';
};

const togglePopover = (event) => {
    apiKeyInput.value = currentApiKey.value || '';
    validationError.value = '';
    popoverRef.value?.toggle(event, pinataButtonRef.value);
};

onMounted(async () => {
    const key = currentApiKey.value;
    
    if (key && key.trim() !== '') {
        const result = await validatePinataApiKey(key);
        
        if (!result.valid && !result.isNetworkError) {
            accountsStore.setPinataApiKey(props.address, '');
        }
    }
});
</script>

<template>
    <div class="relative" ref="pinataButtonRef">
        <Button 
            severity="secondary" 
            class="w-full justify-start!" 
            variant="outlined" 
            @click="togglePopover"
        >
            <i class="text-black dark:text-white pi pi-key"></i>
            <span class="text-black dark:text-white">
                Pinata API key
            </span>
            <i class="text-xs/0! pi ml-auto" :class="{'pi-chevron-down': !popoverRef?.visible, 'pi-chevron-up': popoverRef?.visible}"></i>
        </Button>
        <Badge
            v-if="!accountsStore.getPinataApiKey(props.address)"
            value="!"
            severity="danger"
            size="small"
            class="pinata-config-badge"
        />

        <Popover ref="popoverRef">
            <FloatLabel class="my-4 w-sm">
                <InputGroup>
                    <InputText
                        size="small"
                        v-model="apiKeyInput"
                        :invalid="!!validationError"
                        class="pinata-config-input"
                        @keyup.enter="handleSetApiKey"
                    />
                    <label class="text-sm">Pinata API Key (JWT)</label>

                    <InputGroupAddon>
                        <Button
                            icon="pi pi-times"
                            severity="secondary"
                            @click="handleClear"
                        />
                    </InputGroupAddon>
                    <InputGroupAddon>
                        <Button
                            icon="pi pi-check"
                            :loading="isValidating"
                            @click="handleSetApiKey"
                        />
                    </InputGroupAddon>
                </InputGroup>
            </FloatLabel>

            <small v-if="validationError" class="block text-red-500 mt-1">
                <i class="pi pi-exclamation-circle"></i> {{ validationError }}
            </small>
        </Popover>
    </div>
</template>

<style scoped lang="scss">
.pinata-config-badge {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(25%, -25%);
}
</style>