<script setup>
import { ref, computed } from 'vue';
import { useConfirmation } from '@/composables/useConfirmation';
import { useAccountsStore, useWalletStore } from '@/stores';
import { deletePrivateFile } from '@/utils/pinata';
import { blo } from 'blo';
import { formatAddress } from '@/composables/useFormatting';
import CopyButton from '@/components/CopyButton.vue';
import TransactionInfoBlock from '@/components/account/TransactionInfoBlock.vue';

const props = defineProps({
    safeTx: {
        type: Object,
        required: true
    },
    abi: {
        type: Object,
        required: true
    },
    group: {
        type: Object,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    onFileRemoved: {
        type: Function,
        default: null
    },
    onGroupRemoved: {
        type: Function,
        default: null
    },
    isLastGroup: {
        type: Boolean,
        default: false
    }
});

const accountsStore = useAccountsStore();
const walletStore = useWalletStore();

const isRevoking = ref(false);
const isRejecting = ref(false);

const { confirmAction: confirmRevokeSign } = useConfirmation();
const { confirmAction: confirmReject } = useConfirmation();

const firstFile = computed(() => props.group.files?.[0] || null);

const creatorAddress = computed(() => {
    return firstFile.value?.keyvalues?.signer || null;
});

const isCreator = computed(() => {
    if (!walletStore.walletAddress) return false;
    return walletStore.walletAddress.toLowerCase() === creatorAddress.value.toLowerCase();
});

const currentWalletFile = computed(() => {
    if (!walletStore.walletAddress) return null;
    return props.group.files?.find(file => {
        const signer = file.keyvalues?.signer;
        return signer && signer.toLowerCase() === walletStore.walletAddress.toLowerCase();
    }) || null;
});

const showRevokeSign = computed(() => {
    return walletStore.isConnected && !isCreator.value && !!currentWalletFile.value;
});

const showReject = computed(() => {
    return walletStore.isConnected && isCreator.value;
});

const isRejectDisabled = computed(() => {
    return !props.isLastGroup;
});

async function handleRevokeSign() {
    if (!currentWalletFile.value) return;

    await confirmRevokeSign({
        message: 'Are you sure you want to revoke your signature?',
        header: 'Confirm signature revocation',
        acceptLabel: 'Revoke',
        onAccept: async () => {
            isRevoking.value = true;
            
            const jwt = accountsStore.getPinataApiKey(props.address);
            const fileId = currentWalletFile.value.id;
                
            await deletePrivateFile(jwt, [fileId]);
                
            if (props.onFileRemoved) {
                props.onFileRemoved(fileId);
            }
        },
        onFinally: () => {
            isRevoking.value = false;
        },
        successMessage: 'Signature revoked'
    });
}

async function handleReject() {
    await confirmReject({
        message: 'Are you sure you want to reject this transaction?',
        header: 'Confirm rejection',
        acceptLabel: 'Reject',
        onAccept: async () => {
            isRejecting.value = true;
            
            const jwt = accountsStore.getPinataApiKey(props.address);
            const fileIds = props.group.files.map(file => file.id).filter(id => id);
                
            await deletePrivateFile(jwt, fileIds);
                
            if (props.onGroupRemoved) {
                props.onGroupRemoved();
            }
        },
        onFinally: () => {
            isRejecting.value = false;
        },
        successMessage: 'Transaction rejected'
    });
}

</script>

<template>
    <div class="flex flex-col md:flex-row gap-3">
        <div class="flex-1 p-6 pb-0 md:pr-0 md:pb-6">
            <TransactionInfoBlock
                    :safeTx="safeTx"
                    :abi="abi"
                />
        </div>

        <Divider layout="vertical" class="hidden! md:flex!" />
        <Divider class="md:hidden!" />

        <div class="w-70 p-6 pt-0 md:pl-0 md:pt-6">
            <div class="font-bold text-lg mb-2">Creator</div>
            <div class="flex items-center gap-2">
                <Avatar :image="blo(creatorAddress || '0x')" shape="circle" />
                <span class="font-mono">{{ formatAddress(creatorAddress) }}</span>
                <CopyButton :value="creatorAddress" class="ml-auto" />
            </div>
            <div class="font-bold text-lg my-2">Confirmations</div>
            <div
                v-for="file in group.files"
                :key="file.id"
                class="flex items-center gap-2 my-1"
                        >
                <Avatar :image="blo(file.keyvalues?.signer || '0x')" shape="circle" />
                <span class="font-mono">{{ formatAddress(file.keyvalues?.signer) }}</span>
                <CopyButton :value="file.keyvalues?.signer" class="ml-auto" />
            </div>

            <div class="mt-4">
                <Button
                    v-if="showRevokeSign"
                    label="Revoke sign"
                    severity="danger"
                    outlined
                    class="w-full"
                    :loading="isRevoking"
                    @click="handleRevokeSign"
                />
                <Button
                    v-if="showReject"
                    label="Reject"
                    severity="danger"
                    :disabled="isRejectDisabled || isRejecting"
                    :loading="isRejecting"
                    class="w-full"
                    @click="handleReject"
                    v-tooltip.top="isRejectDisabled ? 'Only the last transaction in the queue can be deleted' : ''"
                />
            </div>

        </div>
    </div>
</template>
