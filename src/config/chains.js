/**
 * Глобальный конфиг блокчейн-сетей
 * Используется для инициализации web3-onboard, protocolKit и отображения в приложении
 */

export const CHAINS = [
    {
        chainId: '1',
        chainName: 'Ethereum',
        rpcUrl: 'https://ethereum-rpc.publicnode.com',
        isTestnet: false,
        logo: '/images/chains/ethereum.png',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        shortName: 'eth'
    },
    {
        chainId: '11155111',
        chainName: 'Sepolia',
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
        isTestnet: true,
        logo: '/images/chains/sepolia.png',
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18
        },
        shortName: 'sep'
    },
    {
        chainId: '84532',
        chainName: 'Base Sepolia',
        rpcUrl: 'https://sepolia.base.org',
        isTestnet: true,
        logo: '/images/chains/base_sepolia.png',
        nativeCurrency: {
            name: 'Base Sepolia Ether',
            symbol: 'ETH',
            decimals: 18
        },
        shortName: 'basep'
    },
    {
        chainId: '80069',
        chainName: 'Bepolia',
        rpcUrl: 'https://bepolia.rpc.berachain.com',
        isTestnet: true,
        logo: '/images/chains/bepolia.png',
        nativeCurrency: {
            name: 'BERA',
            symbol: 'BERA',
            decimals: 18
        },
        shortName: 'bep'
    },
    {
        chainId: '10143',
        chainName: 'Monad Testnet',
        rpcUrl: 'https://testnet-rpc.monad.xyz',
        isTestnet: true,
        logo: '/images/chains/monad_testnet.png',
        nativeCurrency: {
            name: 'Monad',
            symbol: 'MON',
            decimals: 18
        },
        shortName: 'montst'
    }
];
