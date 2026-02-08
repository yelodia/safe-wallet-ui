import { CHAINS } from '@/config/chains';

/**
 * Нормализует chainId: преобразует hex (0x279f) в decimal строку ('10143')
 * @param {string|number} chainId - ID сети в любом формате (hex, decimal, число)
 * @returns {string} chainId в формате decimal строки
 */
export function normalizeChainId(chainId) {
    if (!chainId) return null;
    
    // Если это hex строка (начинается с 0x)
    if (typeof chainId === 'string' && chainId.startsWith('0x')) {
        return parseInt(chainId, 16).toString(10);
    }
    
    // Если это число или decimal строка, просто преобразуем в строку
    return String(chainId);
}

/**
 * Найти сеть по chainId
 * Поддерживает chainId в любом формате (hex, decimal, число)
 * @param {string|number} chainId - ID сети (может быть строкой или числом, hex или decimal)
 * @returns {Object|undefined} Объект сети или undefined, если не найдена
 */
export function getChainById(chainId) {
    const chainIdStr = normalizeChainId(chainId);
    if (!chainIdStr) return undefined;
    
    return CHAINS.find(chain => chain.chainId === chainIdStr);
}

/**
 * Получить сети по типу (testnet/mainnet)
 * @param {boolean} isTestnet - true для testnet, false для mainnet
 * @returns {Array} Массив сетей
 */
export function getChainsByTestnet(isTestnet) {
    return CHAINS.filter(chain => chain.isTestnet === isTestnet);
}

/**
 * Получить только mainnet сети
 * @returns {Array} Массив mainnet сетей
 */
export function getMainnetChains() {
    return getChainsByTestnet(false);
}

/**
 * Получить только testnet сети
 * @returns {Array} Массив testnet сетей
 */
export function getTestnetChains() {
    return getChainsByTestnet(true);
}

/**
 * Конвертировать сети в формат web3-onboard
 * @param {Array} chains - Массив сетей из конфига (по умолчанию все сети)
 * @returns {Array} Массив сетей в формате web3-onboard
 */
export function convertToWeb3OnboardFormat(chains = CHAINS) {
    return chains.map(chain => ({
        id: parseInt(chain.chainId, 10), // web3-onboard ожидает число
        token: chain.nativeCurrency.symbol,
        label: chain.chainName,
        rpcUrl: chain.rpcUrl
    }));
}

/**
 * Получить все сети
 * @returns {Array} Массив всех сетей
 */
export function getAllChains() {
    return CHAINS;
}

/**
 * Преобразует chainId из decimal в hex формат для web3-onboard
 * @param {string|number} chainId - ID сети в decimal формате
 * @returns {string|null} chainId в hex формате (0x...) или null
 */
export function chainIdToHex(chainId) {
    if (!chainId) return null;
    const num = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
    if (Number.isNaN(num)) return null;
    return '0x' + num.toString(16);
}

/**
 * Создает viem Chain объект из chainId
 * @param {string|number} chainId - ID сети
 * @returns {import('viem').Chain} viem Chain объект
 * @throws {Error} Если сеть не найдена
 */
export function getViemChain(chainId) {
    const chainConfig = getChainById(chainId);
    if (!chainConfig) {
        throw new Error(`Chain config not found for chainId: ${chainId}`);
    }

    const chainIdNum = parseInt(chainConfig.chainId, 10);
    return {
        id: chainIdNum,
        name: chainConfig.chainName,
        nativeCurrency: chainConfig.nativeCurrency,
        rpcUrls: {
            default: {
                http: [chainConfig.rpcUrl]
            }
        }
    };
}
