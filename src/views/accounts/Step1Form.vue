<script setup>
import { ref, computed, watch } from 'vue';
import { useForm, useFieldArray } from 'vee-validate';
import { useWalletStore } from '@/stores';
import { useAllFieldsFilled } from '@/composables/useAllFieldsFilled';
import ValidationField from '@/components/ValidationField.vue';

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'next']);

const walletStore = useWalletStore();

const { errors, defineField, values, setFieldValue } = useForm({
    initialValues: props.modelValue
});

const [threshold] = defineField('threshold');

const { fields: owners, push, remove } = useFieldArray('owners');

const allFieldsFilled = useAllFieldsFilled(owners, threshold);

const isEditing = ref(false);

const toggleEditing = (val) => {
    isEditing.value = val;
};

const canProceed = computed(() => {
    return Object.keys(errors.value).length === 0 && allFieldsFilled.value && !isEditing.value;
});

const thresholdOptions = computed(() => {
    const count = owners.value.length;
    return Array.from({ length: count }, (_, i) => ({
        label: String(i + 1),
        value: i + 1
    }));
});

watch(values, (newValues) => {
    if (newValues.owners.length < newValues.threshold) {
        setFieldValue('threshold', newValues.owners.length);
    }
    emit('update:modelValue', { ...newValues });
}, { deep: true });

watch(
    () => walletStore.walletAddress,
    (newValue) => {
        if (newValue && owners.value.length > 0 && !owners.value[0].value) {
            setFieldValue('owners[0]', newValue);
        }
    }, { immediate: true }
);

const handleNext = () => {
    if (!canProceed.value) return;
    emit('next');
};

</script>

<template>
    <Card class="p-2">
        <template #content>
            <h3>Configure Safe Account</h3>

            <div
                v-for="(field, index) in owners"
                :key="field.key"
                class="flex items-top gap-2"
            >
                <ValidationField
                    :name="`owners[${index}]`"
                    :label="`Owner ${index+1}`"
                    validation="isAddress|uniqueInArray"
                    class="flex-1"
                    @input="toggleEditing(true)"
                    @blur="toggleEditing(false)"
                    @keyup.enter="toggleEditing(false)"
                />
                <Button
                    v-if="index > 0"
                    icon="pi pi-times"
                    class="mt-8"
                    severity="danger"
                    outlined
                    @click="remove(index)"
                    :aria-label="'Remove owner ' + (index + 1)"
                />
            </div>

            <Button
                type="button"
                label="Add Owner"
                icon="pi pi-plus"
                outlined
                @click="() => push('')"
                class="mt-4"
            />

            <ValidationField
                name="threshold"
                label="Threshold"
                type="select"
                :options="thresholdOptions"
                optionLabel="label"
                optionValue="value"
            />

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

