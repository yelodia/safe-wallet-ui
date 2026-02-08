import { getAddress, isAddress } from 'viem';
import { createPublicClientFromProvider, getChainIdFromProvider } from './helpers/provider';

// Кеш для задеплоенных контрактов
// Формат: <chainId>_<address>: true
// Кешируются только положительные результаты (задеплоенные контракты)
const deploymentCache = new Map();

/**
 * Проверяет, задеплоен ли контракт по адресу
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {string} contractAddress - Адрес контракта
 * @returns {Promise<boolean>} true если контракт задеплоен, false если не задеплоен или ошибка
 */
export async function isContractDeployed(provider, contractAddress) {
  if (!provider || !contractAddress) {
    return false;
  }

  if (!isAddress(contractAddress)) {
    return false;
  }

  try {
    const normalizedAddress = getAddress(contractAddress);

    const chainId = await getChainIdFromProvider(provider);

    const cacheKey = `${chainId}_${normalizedAddress}`;

    if (deploymentCache.has(cacheKey)) {
      return true;
    }

    const isDeployed = await checkDeployment(provider, normalizedAddress);

    if (isDeployed) {
      deploymentCache.set(cacheKey, true);
    }

    return isDeployed;
  } catch (error) {
    console.error('Error checking contract deployment:', error);
    return false;
  }
}

/**
 * Вспомогательная функция для проверки деплоймента без кеша
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {string} normalizedAddress - Нормализованный адрес контракта
 * @returns {Promise<boolean>} true если контракт задеплоен
 */
async function checkDeployment(provider, normalizedAddress) {
  const publicClient = await createPublicClientFromProvider(provider);

  const bytecode = await publicClient.getCode({ address: normalizedAddress });

  return !!(bytecode && bytecode !== '0x' && bytecode.length > 2);
}
