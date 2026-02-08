import AppLayout from '@/layout/AppLayout.vue';
import AccountLayout from '@/layout/account/AccountLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAccountsStore } from '@/stores';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'main',
                    component: () => import('@/views/Main.vue'),
                    meta: { hideSidebar: true }
                },
                {
                    path: '/accounts/add',
                    name: 'add-account',
                    component: () => import('@/views/accounts/AddAccount.vue'),
                    meta: { hideSidebar: true }
                },
                {
                    path: '/accounts/create',
                    name: 'create-account',
                    component: () => import('@/views/accounts/CreateAccount.vue'),
                    meta: { hideSidebar: true }
                },
                {
                    path: '/account/:address',
                    components: {
                        default: AccountLayout,
                        sidebar: () => import('@/layout/account/AccountSidebar.vue')
                    },
                    beforeEnter: (to, from, next) => {
                        const address = to.params.address;
                        const accountsStore = useAccountsStore();
                        const accountData = accountsStore.getAccount(address);
                        
                        if (!accountData) {
                            next({
                                name: 'not-found',
                                params: { pathMatch: to.path.substring(1).split('/') },
                                replace: true
                            });
                            return;
                        }
                        next();
                    },
                    children: [
                        {
                            path: '',
                            name: 'account-info',
                            component: () => import('@/views/account/AccountInfo.vue')
                        },
                        {
                            path: 'transaction/new',
                            name: 'new-transaction',
                            component: () => import('@/views/account/NewTransaction.vue')
                        },
                        {
                            path: 'transactions',
                            name: 'transaction-list',
                            component: () => import('@/views/account/TransactionList.vue')
                        }
                    ]
                },
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            component: AppLayout,
            meta: { hideSidebar: true },
            children: [
                {
                    path: '',
                    name: 'not-found',
                    component: () => import('@/views/pages/NotFound.vue')
                }
            ]
        }
    ]
});

export default router;
