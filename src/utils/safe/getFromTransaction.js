import { decodeFunctionData, parseAbi, getAddress, isAddress } from 'viem';
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments';
import { createPublicClientFromProvider, getChainIdFromProvider } from './helpers/provider';
import { KNOWN_SAFE_VERSIONS } from '@/config/safeVersions';

// ABI для декодирования createProxyWithNonce
const PROXY_FACTORY_ABI = parseAbi([
  'function createProxyWithNonce(address singleton, bytes initializer, uint256 saltNonce)'
]);

// ABI для декодирования setup
const SAFE_SETUP_ABI = parseAbi([
  'function setup(address[] owners, uint256 threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)'
]);

/**
 * Определяет версию Safe по адресу singleton
 * Перебирает все возможные версии из библиотеки safe-deployments
 * @param {string} singletonAddress - Адрес singleton
 * @param {string} chainId - Chain ID
 * @returns {Promise<string|null>} Версия Safe или null, если не найдена
 */
async function getSafeVersionFromSingleton(singletonAddress, chainId) {
  if (!singletonAddress) return null;

  const normalizedSingleton = getAddress(singletonAddress.toLowerCase());
  
  // Перебираем известные версии Safe из конфига
  // Библиотека safe-deployments не предоставляет API для получения списка всех версий,
  // поэтому используем список из конфига @/config/safeVersions
  for (const version of KNOWN_SAFE_VERSIONS) {
    const deployments = [
      getSafeSingletonDeployments({ version, network: chainId }),
      getSafeL2SingletonDeployments({ version, network: chainId })
    ];

    for (const deployment of deployments) {
      if (!deployment?.deployments) continue;
      for (const [, info] of Object.entries(deployment.deployments)) {
        if (info?.address && getAddress(info.address.toLowerCase()) === normalizedSingleton) {
          return version;
        }
      }
    }
  }

  return '1.3.0';
}

/**
 * Определяет deploymentType на основе адреса singleton
 * @param {string} singletonAddress - Адрес singleton
 * @param {string} chainId - Chain ID
 * @param {string} safeVersion - Версия Safe
 * @returns {string} deploymentType ('canonical' | 'custom')
 */
function determineDeploymentType(singletonAddress, chainId, safeVersion) {
  if (!singletonAddress) return 'canonical';

  const normalizedSingleton = getAddress(singletonAddress.toLowerCase());
  const deployments = [
    getSafeSingletonDeployments({ version: safeVersion, network: chainId }),
    getSafeL2SingletonDeployments({ version: safeVersion, network: chainId })
  ];

  for (const deployment of deployments) {
    if (!deployment?.deployments) continue;
    for (const [type, info] of Object.entries(deployment.deployments)) {
      if (info?.address && getAddress(info.address.toLowerCase()) === normalizedSingleton) {
        return type;
      }
    }
  }

  return 'canonical';
}

/**
 * Извлекает predictedSafe конфиг из транзакции создания Safe
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {string} txHash - Хеш транзакции создания Safe
 * @returns {Promise<{success: boolean, data?: {safeAccountConfig: Object, safeDeploymentConfig: Object}, error?: Error}>}
 */
export async function getPredictedSafeFromTransaction(provider, txHash) {
  if (!provider || !txHash) {
    return {
      success: false,
      error: new Error('Provider and txHash are required')
    };
  }

  try {
    const publicClient = await createPublicClientFromProvider(provider);

    const tx = await publicClient.getTransaction({ hash: txHash });

    if (!tx) {
      return {
        success: false,
        error: new Error('Transaction not found')
      };
    }

    // Декодируем данные транзакции (createProxyWithNonce)
    let decodedFactory;
    try {
      decodedFactory = decodeFunctionData({
        abi: PROXY_FACTORY_ABI,
        data: tx.input
      });
    } catch (e) {
      return {
        success: false,
        error: new Error(`Failed to decode transaction: ${e.message}`)
      };
    }

    if (decodedFactory.functionName !== 'createProxyWithNonce') {
      return {
        success: false,
        error: new Error(`Expected createProxyWithNonce function, got: ${decodedFactory.functionName}`)
      };
    }

    const [singleton, initializer, saltNonce] = decodedFactory.args;

    // Декодируем initializer (setup)
    let decodedSetup;
    try {
      decodedSetup = decodeFunctionData({
        abi: SAFE_SETUP_ABI,
        data: initializer
      });
    } catch (e) {
      return {
        success: false,
        error: new Error(`Failed to decode initializer: ${e.message}`)
      };
    }

    if (decodedSetup.functionName !== 'setup') {
      return {
        success: false,
        error: new Error(`Expected setup function, got: ${decodedSetup.functionName}`)
      };
    }

    const [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver] = decodedSetup.args;

    // Получаем chainId для определения версии и deploymentType
    const chainId = await getChainIdFromProvider(provider);
    if (!chainId) {
      return {
        success: false,
        error: new Error('Failed to get chainId from provider')
      };
    }

    // Получаем версию Safe по адресу singleton
    let safeVersion = await getSafeVersionFromSingleton(singleton, chainId);


    // Определяем deploymentType из singleton
    const deploymentType = determineDeploymentType(singleton, chainId, safeVersion);

    // Нормализуем все адреса
    const normalizedOwners = owners.map(addr => getAddress(addr.toLowerCase()));
    const normalizedFallbackHandler = getAddress(fallbackHandler.toLowerCase());
    const normalizedTo = getAddress(to.toLowerCase());
    const normalizedPaymentToken = getAddress(paymentToken.toLowerCase());
    const normalizedPaymentReceiver = getAddress(paymentReceiver.toLowerCase());

    // Формируем результат
    const safeAccountConfig = {
      owners: normalizedOwners,
      threshold: Number(threshold),
      fallbackHandler: normalizedFallbackHandler,
      to: normalizedTo,
      data: data,
      paymentToken: normalizedPaymentToken,
      payment: Number(payment),
      paymentReceiver: normalizedPaymentReceiver
    };

    const safeDeploymentConfig = {
      saltNonce: saltNonce.toString(),
      safeVersion: safeVersion,
      deploymentType: deploymentType
    };

    return {
      success: true,
      data: {
        safeAccountConfig,
        safeDeploymentConfig
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
