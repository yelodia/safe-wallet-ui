<script setup>
import { useAccountsStore } from '@/stores';
import AccountItem from '@/components/accounts/AccountItem.vue';

const accountsStore = useAccountsStore();
</script>

<template>
    <div class="flex items-center gap-2">
        <h1 class="mr-auto! mb-0!">Accounts</h1>

        <router-link to="/accounts/add">
            <Button label="Add" icon="pi pi-plus" />
        </router-link>
        <router-link to="/accounts/create">
            <Button label="Create New" icon="pi pi-plus-circle" />
        </router-link>
    </div>

    <div v-if="!accountsStore.hasAccounts" class="empty-state">
        <svg class="mx-auto" width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M21.757 11.998h-2.485c-.742 0-1.343.579-1.343 1.293v3.47c0 .714-.602 1.293-1.344 1.293H6.699c-.743 0-1.344.578-1.344 1.292v2.391c0 .714.601 1.293 1.344 1.293h10.458c.742 0 1.335-.579 1.335-1.293V19.82c0-.714.602-1.22 1.344-1.22h1.92c.743 0 1.344-.58 1.344-1.293v-4.03c0-.714-.601-1.278-1.343-1.278ZM5.355 7.249c0-.714.6-1.293 1.343-1.293h9.88c.743 0 1.344-.579 1.344-1.293v-2.39c0-.714-.601-1.293-1.344-1.293H6.125c-.742 0-1.343.579-1.343 1.293v1.842c0 .714-.602 1.292-1.344 1.292H1.526C.784 5.407.182 5.986.182 6.7v4.034c0 .714.604 1.264 1.346 1.264h2.485c.743 0 1.344-.579 1.344-1.293L5.355 7.25ZM10.472 9.485h2.387c.778 0 1.409.608 1.409 1.356v2.296c0 .748-.632 1.356-1.41 1.356h-2.386c-.778 0-1.409-.608-1.409-1.356v-2.296c0-.749.632-1.356 1.409-1.356Z"
                fill="currentColor"></path>
        </svg>
        <h2>No Safe Accounts yet</h2>
        <p>
            Safe Accounts are multi-signature smart contract wallets that provide enhanced security
            by requiring multiple approvals for transactions.
        </p>
        <p>Start by creating a new Safe or adding an existing one to your account.</p>
    </div>

    <Card class="mt-4" v-else>
        <template #content>
            <AccountItem v-for="account in accountsStore.accountsList" :key="account.address" :account="account" />
        </template>
    </Card>

</template>

