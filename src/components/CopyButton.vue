<script setup>
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    value: {
        type: String,
        required: true
    }
});

const toast = useToast();

const handleCopy = async () => {
    if (!props.value) return;

    try {
        await navigator.clipboard.writeText(props.value);
        toast.add({
            severity: 'success',
            summary: 'Copied',
            detail: 'Copied to clipboard',
            life: 3000
        });
    } catch (error) {
        console.error('Failed to copy:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to copy to clipboard',
            life: 3000
        });
    }
};
</script>

<template>
    <Button
        icon="pi pi-copy"
        variant="outlined"
        size="small"
        @click.stop="handleCopy"
        :aria-label="'Copy ' + value"
    />
</template>
