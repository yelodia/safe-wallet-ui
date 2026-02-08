<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAccountsStore } from '@/stores';
import { eventBus, EVENTS } from '@/utils/eventBus';
import { getAddress } from 'viem';
import { blo } from 'blo';
import { formatAddress } from '@/composables/useFormatting';
import CopyButton from '@/components/CopyButton.vue';
import Accounts from '@/components/accounts/Accounts.vue';
import PinataConfig from '@/components/accounts/PinataConfig.vue';

const route = useRoute();
const accountsStore = useAccountsStore();

const isDeployed = ref(false);
const isDrawerOpen = ref(false);

const address = computed(() => getAddress(route.params.address));

const accountData = computed(() => accountsStore.getAccount(address.value));

const thresholdInfo = computed(() => {
    return `${accountData.value.account.threshold}/${accountData.value.account.owners.length}`;
});

const newTransactionPath = computed(() => {
    return `/account/${address.value}/transaction/new`;
});

function handleContractDeployed(event) {
    isDeployed.value = event.deployed;
}

function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value;
}

onMounted(() => {
    eventBus.on(EVENTS.CONTRACT_DEPLOYED, handleContractDeployed)
})

onUnmounted(() => {
    eventBus.off(EVENTS.CONTRACT_DEPLOYED, handleContractDeployed)
})

watch(
    () => route.path,
    () => {
        isDeployed.value = false;
        isDrawerOpen.value = false;
    }
);

</script>

<template>

    <div class="py-3 mb-4 rounded-lg flex items-center gap-2 relative cursor-pointer" @click="toggleDrawer">
        <Avatar :image="blo(address || '0x')" shape="circle" size="large" />
        <span class="font-mono">{{ formatAddress(address) }}</span>
        <Tag 
                :value="thresholdInfo" 
                severity="success"
                rounded 
                class="account-badge"
        />
        <CopyButton :value="address" />
        <i class="pi pi-chevron-right text-xs/0! text-muted-color ml-auto" />
    </div>

    <RouterLink :to="newTransactionPath">
        <Button
            class="w-full"
            size="large"
            label="New transaction"
            icon="pi pi-plus"
            :disabled="isDeployed === false"
        />
    </RouterLink>

    <Divider />
    <RouterLink :to="`/account/${address}`" v-slot="{ isExactActive }" class="block" >
        <Button 
            :severity="!isExactActive ? 'secondary' : ''" 
            class="w-full justify-start!" 
            variant="text" 
            icon="pi pi-objects-column" 
            label="Safe config" 
        />
    </RouterLink>

    <RouterLink :to="`/account/${address}/transactions`" v-slot="{ isExactActive }" class="block" >
        <Button 
            :severity="!isExactActive ? 'secondary' : ''" 
            class="w-full justify-start!" 
            variant="text" 
            icon="pi pi-hourglass" 
            label="Pending transactions" 
        />
    </RouterLink>

    <Divider />

    <PinataConfig :address="address" />
        
    <Drawer 
        v-model:visible="isDrawerOpen" 
        position="left"
        header=" "
        class="!w-full sm:!w-[40rem]"
    >
        <Accounts />
    </Drawer>

</template>

<style scoped>
.account-badge {
    position: absolute;
    top: 0;
    left: 25px;
}
</style>
