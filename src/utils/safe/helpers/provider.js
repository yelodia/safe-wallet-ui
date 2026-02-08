import { createPublicClient, http } from 'viem';
import { getChainById, getViemChain } from '@/utils/chains';

/**
 * Извлекает chainId из провайдера без RPC запросов (где возможно)
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @returns {Promise<string|null>} chainId или null, если не удалось извлечь
 */
export async function getChainIdFromProvider(provider) {
  if (!provider) {
    return null;
  }

  // Если провайдер - строка (RPC URL)
  if (typeof provider === 'string') {
    // Ищем в конфиге CHAINS по rpcUrl (синхронно, без RPC)
    const chains = await import('@/config/chains');
    const chain = chains.CHAINS.find(c => c.rpcUrl === provider);
    return chain ? chain.chainId : null;
  }

  // Если провайдер - PublicClient
  if (provider && typeof provider === 'object' && 'chain' in provider && provider.chain) {
    // Используем chain.id если chain был передан при создании (синхронно)
    return provider.chain.id.toString();
  }

  // Если провайдер - EIP-1193
  if (provider && typeof provider === 'object' && 'request' in provider) {
    try {
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      return chainIdHex ? parseInt(chainIdHex, 16).toString() : null;
    } catch (error) {
      console.error('Failed to get chainId from EIP-1193 provider:', error);
      return null;
    }
  }

  return null;
}

/**
 * Создает viem PublicClient из провайдера
 * Используется только когда нужен именно PublicClient (например, для getTransaction)
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @returns {Promise<import('viem').PublicClient>} PublicClient
 */
export async function createPublicClientFromProvider(provider) {
  if (!provider) {
    throw new Error('Provider is required');
  }

  if (provider && typeof provider === 'object' && 'chain' in provider && 'getBlockNumber' in provider) {
    return provider;
  }

  const chainId = await getChainIdFromProvider(provider);
  if (!chainId) {
    throw new Error('Failed to get chainId from provider');
  }

  const chainConfig = getChainById(chainId);
  if (!chainConfig?.rpcUrl) {
    throw new Error(`Chain config not found for chainId: ${chainId}`);
  }

  const viemChain = getViemChain(chainId);

  return createPublicClient({
    chain: viemChain,
    transport: http(chainConfig.rpcUrl)
  });
}
