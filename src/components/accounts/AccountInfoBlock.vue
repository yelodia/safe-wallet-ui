<script setup>
import { useSettingsStore } from '@/stores';
import CopyButton from '@/components/CopyButton.vue';
import { blo } from 'blo';

const props = defineProps({
    predictedSafe: {
        type: Object,
        required: true
    }
});

const settingsStore = useSettingsStore();
</script>

<template>
    <div class="sm:flex gap-2 my-4">
        <div class="w-30 font-bold mb-2 sm:mb-0">Network:</div>
        <div class="flex flex-auto items-center gap-2">
            <Avatar :image="settingsStore.currentAppChain?.logo" shape="circle" class="w-5! h-5!" />
            <span>{{ settingsStore.currentAppChain?.chainName }}</span>
        </div>
    </div>
    <Divider />
    <div class="sm:flex gap-2 my-4">
        <div class="w-30 font-bold sm:mt-2 mb-2 sm:mb-0">Signers:</div>
        <div>
            <div v-for="(owner, index) in predictedSafe.safeAccountConfig.owners" :key="index" class="flex items-center gap-2 my-1"">
                <Avatar :image="blo(owner || '0x')" shape="circle" class="w-5! h-5!" />
                <span class="text-sm font-mono">{{ owner }}</span>
                <CopyButton :value="owner" />
            </div>
        </div>
    </div>
    <Divider />
    <div class="sm:flex gap-2 my-4">
        <div class="w-30 font-bold mb-2 sm:mb-0">Threshold:</div>
        <div>
            {{ predictedSafe.safeAccountConfig.threshold }}/{{ predictedSafe.safeAccountConfig.owners.length }}
        </div>
    </div>

</template>


