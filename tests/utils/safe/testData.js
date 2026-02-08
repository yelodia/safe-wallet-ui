import { CHAINS } from '@/config/chains';

// Константы для адресов
export const SEPOLIA_SAFE_ADDRESS = '0xf532db081DFB598b5541140cAd55834a1534B96c';
export const SEPOLIA_TX_HASH = '0x94c05be6ccdc93cfb0fd651ff221d71ccfbdb1bb730226cdbe15d9632d063eb1';
export const INVALID_TX_HASH = '0x9e4d70535503d3f5f64c6ba32b86c29a05fd99547566507ddc6a3b576c51b6cb';

// RPC URL из конфига chains
export const SEPOLIA_RPC_URL = CHAINS.find(chain => chain.chainId === '11155111')?.rpcUrl;
export const MAINNET_RPC_URL = CHAINS.find(chain => chain.chainId === '1')?.rpcUrl;

// Полный конфиг для тестов
export const fullSafeAccountConfig = {
    owners: [
        '0x4a8a9BCD144BeAa678686F43CcFad8b666260A26',
        '0x05529Ee597F309c2f4610a16F352A0bEbc58dC59',
        '0x5a0FB046B56D2Cc0167b1162231C78F739b88a84'
    ],
    threshold: 2,
    fallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
    to: '0xbd89a1ce4dde368ffab0ec35506eece0b1ffdc54',
    data: '0xfe51f64300000000000000000000000029fcb43b46531bca003ddc8fcb67ffe91900c762',
    paymentToken: '0x0000000000000000000000000000000000000000',
    payment: 0,
    paymentReceiver: '0x5afe7A11E7000000000000000000000000000000'
};

export const fullSafeDeploymentConfig = {
    saltNonce: 0,
    safeVersion: '1.4.1',
    deploymentType: 'canonical'
};

// Минимальный конфиг (только owners и threshold)
export const minimalSafeAccountConfig = {
    owners: [
        '0x4a8a9BCD144BeAa678686F43CcFad8b666260A26',
        '0x05529Ee597F309c2f4610a16F352A0bEbc58dC59',
        '0x5a0FB046B56D2Cc0167b1162231C78F739b88a84'
    ],
    threshold: 2
};
