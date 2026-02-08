<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores';
import { useChains } from '@/composables/useChains';
import { eventBus, EVENTS } from '@/utils/eventBus';

const settingsStore = useSettingsStore();
const { getMainnetChains, getTestnetChains } = useChains();
const popoverRef = ref(null);
const chainSelectorRef = ref(null);
const locked = ref(false);

const mainnetChains = getMainnetChains();
const testnetChains = getTestnetChains();

const handleChainSelect = (chainId) => {
    settingsStore.setCurrentAppChainId(chainId);
    popoverRef.value?.hide();
};

const togglePopover = (event) => {
    popoverRef.value?.toggle(event, chainSelectorRef.value);
};

function handleLockChain(newValue) {
    locked.value = newValue;
    if (locked.value) {
        popoverRef.value?.hide();
    }
}

onMounted(() => {
    eventBus.on(EVENTS.LOCK_CHAIN, handleLockChain)
})

onUnmounted(() => {
    eventBus.off(EVENTS.LOCK_CHAIN, handleLockChain)
})

</script>

<template>
    <div ref="chainSelectorRef">
        <Button 
            variant="outlined" 
            severity="secondary"
            size="small"
            :disabled="locked"
            @click="togglePopover"
        >
            <Avatar :image="settingsStore.currentAppChain.logo" shape="circle" />
            <span class="hidden sm:block text-black dark:text-white">{{ settingsStore.currentAppChain?.chainName }}</span>
            <i class="text-xs/0! pi" :class="{'pi-chevron-down': !popoverRef?.visible, 'pi-chevron-up': popoverRef?.visible}"></i>
        </Button>

        <Popover ref="popoverRef">
            <div class="chain-selector">
                <Button 
                    v-for="chain in mainnetChains"
                    :key="chain.chainId"
                    variant="text" 
                    severity="contrast" 
                    size="small"
                    class="w-full justify-start!"
                    @click="handleChainSelect(chain.chainId)"
                >
                    <Avatar :image="chain.logo" shape="circle" class="h-6! w-6!" />
                    {{ chain.chainName }}
                </Button>

                <div class="divider" v-if="testnetChains.length > 0">
                    <Divider />
                    <span>Testnets</span>
                </div>

                <Button 
                    v-for="chain in testnetChains"
                    :key="chain.chainId"
                    variant="text" 
                    severity="contrast" 
                    size="small"
                    class="w-full justify-start!"
                    @click="handleChainSelect(chain.chainId)"
                >
                    <Avatar :image="chain.logo" shape="circle" class="h-6! w-6!" />
                    {{ chain.chainName }}
                </Button>
            </div>

        </Popover>
    </div>
</template>

<style scoped lang="scss">
.chain-selector {
    max-width: 200px;
}

.divider { 
    position: relative;

    span {
        position: absolute;
        top: -6px;
        background-color: var(--p-popover-background);
        text-align: center;
        left: 50%;
        width: 64px;
        margin-left: -32px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-color-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}

</style>
