<script setup>
import { ref, computed, watch } from 'vue';
import { useForm, useFieldArray } from 'vee-validate';
import { useAllFieldsFilled } from '@/composables/useAllFieldsFilled';
import { getAbiMethods } from '@/utils/solidity/abiParser';
import { getInputValidationRules } from '@/utils/solidity/getInputValidationRules';
import { formatAbiParameter } from 'abitype';
import { useSettingsStore } from '@/stores';
import { getAbiFromSourcify } from '@/utils/sourcify';
import ValidationField from '@/components/ValidationField.vue';

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'next']);

const { errors, defineField, values, setFieldValue } = useForm({
    initialValues: props.modelValue
});

const [contractAddress] = defineField('contractAddress');
const [abi] = defineField('abi');
const [selectedMethod] = defineField('selectedMethod');
const [value] = defineField('value');

const settingsStore = useSettingsStore();

const isAbiLoading = ref(false);
let abortController = null;

const { fields: inputs } = useFieldArray('inputs');

const methods = computed(() => {
    if (!abi.value || !abi.value.trim()) {
        return [];
    }
    try {
        const { methods: abiMethods } = getAbiMethods(abi.value.trim());
        return abiMethods.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
});

const showMethodFields = computed(() => {
    return !errors.value.contractAddress && !errors.value.abi && methods.value.length > 0 && baseFieldsFilled.value;
});

const isPayable = computed(() => {
    return selectedMethod.value?.payable || false;
});

const baseFieldsFilled = useAllFieldsFilled(
    contractAddress,
    abi
);

const methodFieldsFilled = useAllFieldsFilled(
    selectedMethod,
    inputs
);

const allFieldsFilled = computed(() => {
    let valueFilled = !isPayable.value || (value.value && value.value.trim() !== '');
    return baseFieldsFilled.value && methodFieldsFilled.value && valueFilled;
});

const isEditing = ref(false);

const toggleEditing = (val) => {
    isEditing.value = val;
};

const canProceed = computed(() => {
    return Object.keys(errors.value).length === 0 && allFieldsFilled.value && !isEditing.value;
});

watch(selectedMethod, (newMethod) => {
    if (!newMethod || !newMethod.inputs) {
        setFieldValue('inputs', []);
        setFieldValue('value', '');
        return;
    }
    
    const inputsWithValues = newMethod.inputs.map((em) => ({ value: '', input: em }));
    setFieldValue('inputs', inputsWithValues);
    
    if (!newMethod.payable) {
        setFieldValue('value', '');
    }
});

watch(methods, (newMethods) => {
    if (newMethods.length > 0) {
        setFieldValue('selectedMethod', newMethods[0]);
    }
}, { immediate: true });

watch(values, (newValues) => {
    emit('update:modelValue', { ...newValues });
}, { deep: true });

watch(contractAddress, async (newAddress) => {
    if (abortController) {
        abortController.abort();
    }

    isAbiLoading.value = false;

    const trimmedAddress = newAddress.trim();

    if (errors.value.contractAddress || !trimmedAddress) {
        return;
    }

    abortController = new AbortController();
    isAbiLoading.value = true;

    const abiResult = await getAbiFromSourcify(
        trimmedAddress,
        settingsStore.currentAppChainId,
        abortController.signal
    );

    if (abiResult) {
        setFieldValue('abi', abiResult);
    }
    isAbiLoading.value = false;
    abortController = null;

}, { immediate: false });

const handleNext = () => {
    if (!canProceed.value) return;
    emit('next');
};
</script>

<template>
    <Card class="p-2">
        <template #content>
            <h3>Configure Transaction</h3>

            <ValidationField
                name="contractAddress"
                label="Contract Address"
                validation="isAddress"
                @input="toggleEditing(true)"
                @blur="toggleEditing(false)"
                @keyup.enter="toggleEditing(false)"
            />

            <div class="relative">
                <span v-if="isAbiLoading" class="abi-loading-icon bg-contrast text-primary-contrast rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="pi pi-spin pi-spinner"></i>
                </span>
                <ValidationField
                    name="abi"
                    label="ABI"
                    type="textarea"
                    validation="isJson|hasAbiMethods"
                    @input="toggleEditing(true)"
                    @blur="toggleEditing(false)"
                />
            </div>

            <template v-if="showMethodFields">
                <ValidationField
                    name="selectedMethod"
                    label="Method"
                    type="select"
                    :options="methods"
                    optionLabel="name"
                />

                <ValidationField
                    v-if="isPayable"
                    name="value"
                    label="Value (ETH)"
                    validation="isAmount"
                    @input="toggleEditing(true)"
                    @blur="toggleEditing(false)"
                    @keyup.enter="toggleEditing(false)"
                />

                <div v-if="selectedMethod && selectedMethod.inputs && selectedMethod.inputs.length > 0">
                    <ValidationField
                        v-for="(field, index) in inputs"
                        :key="field.key"
                        :name="`inputs[${index}].value`"
                        :label="formatAbiParameter(selectedMethod.inputs[index])"
                        :validation="getInputValidationRules(selectedMethod.inputs[index])"
                        @input="toggleEditing(true)"
                        @blur="toggleEditing(false)"
                        @keyup.enter="toggleEditing(false)"
                    />
                </div>
            </template>

            <div class="flex mt-8 justify-end">
                <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    @click="handleNext"
                    :disabled="!canProceed"
                />
            </div>
        </template>
    </Card>
</template>


<style scoped>
.abi-loading-icon {
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 1;
}
</style>