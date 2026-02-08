<script setup>
import { watch } from 'vue';
import { init } from '@web3-onboard/vue';
import injectedModule from '@web3-onboard/injected-wallets';
import { convertToWeb3OnboardFormat, getChainById } from '@/utils/chains';
import { useOnboard } from '@web3-onboard/vue';
import { useWalletStore, useSettingsStore } from '@/stores';

const injected = injectedModule();
const chains = convertToWeb3OnboardFormat();

const onboard = init({
    wallets: [injected],
    theme: 'light',
    chains,
    appMetadata: {
        name: 'Safe UI',
        icon: '/logo.png',
        description: 'Simple UI for Safe Wallet'
    },
    accountCenter: {
        mobile: {
            enabled: false
        },
        desktop: {
            enabled: false
        }
    },
    connect: {
        removeWhereIsMyWalletWarning: true,
        autoConnectLastWallet: true
    }
});

const { connectedWallet, connectedChain } = useOnboard();
const walletStore = useWalletStore();
const settingsStore = useSettingsStore();

watch(
    () => settingsStore.isDarkMode,
    (isDark) => {
        onboard.state.actions.updateTheme(isDark ? 'dark' : 'light');
    },
    { immediate: true }
);

watch(
    [connectedWallet, connectedChain],
    ([wallet, chain], [oldWallet]) => {
        if (wallet && wallet.accounts && wallet.accounts.length > 0) {
            const account = wallet.accounts[0];
            const address = account.address;
            const walletLabel = wallet.label;
            const walletIcon = wallet.icon || null;
            const chainId = chain?.id || null;
            // Используем баланс напрямую из web3-onboard
            // Формат: { ETH: '5.158861327235023441' } или null
            const balance = account.balance || null;
            if (balance === null && chainId && getChainById(chainId)) {
                onboard.state.actions.updateBalances([address]);
            }

            walletStore.setWalletState(
                true,
                address,
                walletLabel,
                chainId,
                walletIcon,
                balance
            );
        } else {
            walletStore.resetWalletState();
        }
    },
    { immediate: true, deep: true }
);

// onboard.state.actions.updateBalances([walletStore.walletAddress])

</script>

<template>
    <router-view />
</template>
