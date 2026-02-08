<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAddress } from 'viem/utils';
import { blo } from 'blo';
import { useConfirmation } from '@/composables/useConfirmation';
import { useAccountsStore } from '@/stores';
import { formatAddress } from '@/composables/useFormatting';
import CopyButton from '@/components/CopyButton.vue';

const props = defineProps({
    account: {
        type: Object,
        required: true,
        validator: (value) => {
            return value.address && value.account && value.deploy;
        }
    }
});

const router = useRouter();
const route = useRoute();
const accountsStore = useAccountsStore();
const { confirmAction } = useConfirmation();

const formattedAddress = computed(() => {
    return formatAddress(props.account.address, 6, 6);
});

const thresholdBadge = computed(() => {
    return `${props.account.account.threshold}/${props.account.account.owners.length}`;
});

const handleDelete = () => {
    confirmAction({
        message: `Are you sure you want to delete account ${formattedAddress.value}?`,
        header: 'Confirm deletion',
        acceptLabel: 'Delete',
        onAccept: () => {
            const accountAddress = props.account.address;
            accountsStore.removeAccount(accountAddress);
            
            const currentAddress = route.params.address;
            if (currentAddress && currentAddress.toLowerCase() === accountAddress.toLowerCase()) {
                router.push({ name: 'main' });
            }
        },
        successMessage: 'Account deleted'
    });
};
</script>

<template>

    <div class="flex gap-2 items-center block-link p-2 rounded-lg">
        <router-link :to="`/account/${account.address}`" class="flex items-center gap-4">
            <Avatar :image="blo(account.address)" shape="circle" size="large" />
            <span class="font-mono mr-10">{{ formattedAddress }}</span>
            <Tag severity="success" :value="thresholdBadge" rounded></Tag>
        </router-link>
        <CopyButton :value="account.address" class="ml-auto" />
        <Button icon="pi pi-trash" variant="outlined" severity="danger" size="small" @click.stop="handleDelete" />

    </div>

</template>
