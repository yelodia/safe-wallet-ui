import {
  getCompatibilityFallbackHandlerDeployment,
  getSafeToL2SetupDeployments,
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments
} from '@safe-global/safe-deployments';
import { getChainIdFromProvider } from './helpers/provider';

// Константы
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_DATA = '0x';
const ECOSYSTEM_ID_ADDRESS = '0x5afe7A11E7000000000000000000000000000000';

/**
 * Получает адрес из deployment
 * Сначала проверяет networkAddresses[chainId], если нет - использует defaultAddress
 * @param {Object} deployment - Deployment объект из safe-deployments
 * @param {string} chainId - Chain ID сети
 * @returns {string|null} Адрес или null, если не найден
 */
function getCanonicalOrFirstAddress(deployment, chainId) {
  if (!deployment) return null;

  // Сначала проверяем networkAddresses для конкретной сети
  if (deployment.networkAddresses && deployment.networkAddresses[chainId]) {
    const address = deployment.networkAddresses[chainId];
    return typeof address === 'string' ? address : null;
  }

  // Если нет, используем defaultAddress
  const defaultAddr = deployment.defaultAddress;
  return typeof defaultAddr === 'string' ? defaultAddr : null;
}

/**
 * Формирует полный конфиг predictedSafe из минимального конфига
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {Object} minimalSafeAccountConfig - Минимальный конфиг с owners и threshold
 * @param {string[]} minimalSafeAccountConfig.owners - Массив адресов владельцев
 * @param {number} minimalSafeAccountConfig.threshold - Порог подписей
 * @param {number} saltNonce - Salt nonce для создания Safe
 * @param {string} [safeVersion='1.4.1'] - Версия Safe (опционально, по умолчанию '1.4.1')
 * @returns {Promise<{success: boolean, data?: Object, error?: Error}>} Результат с полным конфигом или ошибкой
 */
export async function buildFullPredictedSafe(
  provider,
  minimalSafeAccountConfig,
  saltNonce,
  safeVersion = '1.4.1'
) {
  try {
    if (!provider) {
      return {
        success: false,
        error: new Error('Provider is required')
      };
    }

    if (!minimalSafeAccountConfig || !minimalSafeAccountConfig.owners || !minimalSafeAccountConfig.threshold) {
      return {
        success: false,
        error: new Error('minimalSafeAccountConfig with owners and threshold is required')
      };
    }

    const chainId = await getChainIdFromProvider(provider);
    if (!chainId) {
      return {
        success: false,
        error: new Error('Failed to get chainId from provider')
      };
    }

    // Сортируем owners по toLowerCase()
    const sortedOwners = [...minimalSafeAccountConfig.owners]
      .filter(owner => owner && typeof owner === 'string')
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // Получаем fallbackHandler
    const fallbackHandlerDeployment = getCompatibilityFallbackHandlerDeployment({
      version: safeVersion,
      network: chainId
    });

    if (!fallbackHandlerDeployment) {
      return {
        success: false,
        error: new Error(`Fallback handler deployment not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    const fallbackHandlerAddress = getCanonicalOrFirstAddress(fallbackHandlerDeployment, chainId);
    if (!fallbackHandlerAddress) {
      return {
        success: false,
        error: new Error(`Fallback handler address not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    // Получаем deployments для миграции
    const safeToL2SetupDeployments = getSafeToL2SetupDeployments({
      version: '1.4.1', // SafeToL2Setup всегда версии 1.4.1
      network: chainId
    });
    const safeToL2SetupAddress = getCanonicalOrFirstAddress(safeToL2SetupDeployments, chainId);

    const safeL2Deployments = getSafeL2SingletonDeployments({
      version: safeVersion,
      network: chainId
    });
    const safeL2Address = getCanonicalOrFirstAddress(safeL2Deployments, chainId);

    const safeL1Deployments = getSafeSingletonDeployments({
      version: safeVersion,
      network: chainId
    });
    const safeL1Address = getCanonicalOrFirstAddress(safeL1Deployments, chainId);

    // Определяем, нужна ли миграция
    const hasSafeToL2Setup = Boolean(safeToL2SetupAddress);
    const hasSafeL2Address = Boolean(safeL2Address);
    // Сравнение версий как строк (для '1.4.1' >= '1.4.1' вернет true)
    const versionOk = safeVersion >= '1.4.1';
    const includeMigration = hasSafeToL2Setup && hasSafeL2Address && versionOk;

    // Определяем to и data
    let toAddress = ZERO_ADDRESS;
    let dataValue = EMPTY_DATA;

    if (includeMigration) {
      if (!safeToL2SetupAddress || !safeL2Address) {
        return {
          success: false,
          error: new Error('Migration requires safeToL2SetupAddress and safeL2Address')
        };
      }

      toAddress = safeToL2SetupAddress;
      
      // Кодируем data для setupToL2(address)
      // Селектор функции setupToL2(address) = 0xfe51f643
      const functionSelector = '0xfe51f643';
      const paddedAddress = safeL2Address.toLowerCase().replace('0x', '').padStart(64, '0');
      dataValue = functionSelector + paddedAddress;
    }

    // Формируем полный конфиг
    const safeAccountConfig = {
      owners: sortedOwners,
      threshold: minimalSafeAccountConfig.threshold,
      fallbackHandler: fallbackHandlerAddress,
      to: toAddress,
      data: dataValue,
      paymentToken: ZERO_ADDRESS,
      payment: 0,
      paymentReceiver: ECOSYSTEM_ID_ADDRESS
    };

    const safeDeploymentConfig = {
      saltNonce: saltNonce || 0,
      safeVersion: safeVersion,
      deploymentType: 'canonical'
    };

    const predictedSafe = {
      safeAccountConfig,
      safeDeploymentConfig
    };

    return {
      success: true,
      data: predictedSafe
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
