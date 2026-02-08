<script setup>
import { computed, ref } from 'vue';
import { formatEther } from 'viem';
import { blo } from 'blo';
import { formatAddress } from '@/composables/useFormatting';
import CopyButton from '@/components/CopyButton.vue';
import { decodeMethodInputs } from '@/utils/solidity/abiParser';

const props = defineProps({
    safeTx: {
        type: Object,
        required: true
    },
    abi: {
        type: Object,
        required: true
    }
});

const isExpanded = ref(false);

const formattedValue = computed(() => {
    if (!props.safeTx?.data?.value || props.safeTx.data.value === '0' || props.safeTx.data.value === '0x0') {
        return '0';
    }
    try {
        const valueInEth = formatEther(props.safeTx.data.value);
        return valueInEth;
    } catch {
        return props.safeTx.data.value;
    }
});

const operationValue = computed(() => {
    const op = props.safeTx?.data?.operation;
    if (op === 0 || op === '0') {
        return '0 (call)';
    } else if (op === 1 || op === '1') {
        return '1 (delegateCall)';
    }
    return op !== undefined ? `${op} (call)` : '0 (call)';
});

const decodedMethod = computed(() => {
    return decodeMethodInputs(props.abi, props.safeTx.data.data);
});

const methodName = computed(() => {
    return decodedMethod.value?.functionName || '';
});

const methodInputs = computed(() => {
    return decodedMethod.value?.inputs || [];
});

const formatInputValue = (value) => {
    if (value === null || value === undefined) {
        return value;
    }
    
    if (typeof value === 'string') {
        return value.replace(/\s+/g, '');
    }
    
    if (Array.isArray(value) || typeof value === 'object') {
        return JSON.stringify(value).replace(/\s+/g, '');
    }
    
    return String(value).replace(/\s+/g, '');
};

</script>

<template>
    <div class="text-lg">
        <div class="inline-block align-middle mr-3 mb-1">
            Call 
            <Tag severity="info" :value="methodName" />
            on 
        </div>
        <div class="inline-flex items-center gap-3 align-middle mb-1">
            <Avatar :image="blo(safeTx.data.to)" shape="circle" />
            <span class="font-mono">{{ formatAddress(safeTx.data.to) }}</span>
            <CopyButton :value="safeTx.data.to" />
        </div>
    </div>
    <div 
        v-for="(input, index) in methodInputs" 
        :key="index"
        class="my-2"
    >
        <div class="text-lg font-bold">
            {{ input.name }} 
            <span class="text-muted-color">({{ input.type }}):</span>
        </div>
        <div class="flex items-center gap-2">
            <Avatar :image="blo(input.value)" shape="circle" v-if="input.type === 'address'" />
            <span class="break-all font-mono text-sm">
                {{ formatInputValue(input.value) }}
            </span>
        </div>
    </div>

    <div class="relative my-6">
        <Divider />
        <Button 
            @click="isExpanded = !isExpanded" 
            :icon="isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" 
            size="small" 
            severity="secondary" 
            rounded 
            class="expand-button" 
        />
    </div>

    <div v-if="isExpanded">
        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">To:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.to }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">Value:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ formattedValue }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">Data:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.data || '0x' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">Operation:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ operationValue }}
                <i class="pi pi-check text-green-500"></i>
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">SafeTxGas:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.safeTxGas || '0' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">BaseGas:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.baseGas || '0' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">GasPrice:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.gasPrice || '0' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">GasToken:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.gasToken || '0x0000000000000000000000000000000000000000' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">RefundReceiver:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.refundReceiver || '0x0000000000000000000000000000000000000000' }}
            </Tag>
        </div>

        <div class="sm:flex gap-2 mb-2">
            <div class="w-30 sm:mb-0 text-sm">Nonce:</div>
            <Tag severity="secondary" class="break-all font-mono flex-1 justify-start! font-normal!">
                {{ safeTx.data.nonce || '0' }}
            </Tag>
        </div>
    </div>

</template>

<style scoped>
.expand-button {
    position: absolute;
    top: -14px;
    right: 50%;
    margin-right: -14px;
}
</style>