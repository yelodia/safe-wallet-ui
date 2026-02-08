import Safe from '@safe-global/protocol-kit';
import { normalizePredictedSafe } from './helpers/normalizePredictedSafe';
import { mergeWithDefaultConfig } from './helpers/defaultConfig';

/**
 * Инициализирует Safe (новый или существующий)
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {string|Object} safeAddressOrConfig - Адрес Safe контракта (строка) или конфиг predictedSafe (объект { safeAccountConfig, safeDeploymentConfig })
 * @returns {Promise<{success: boolean, safeSDK?: import('@safe-global/protocol-kit').default, error?: Error}>}
 */
export async function initSafe(provider, safeAddressOrConfig) {
  try {
    // Формируем параметры для Safe.init
    const parameters = typeof safeAddressOrConfig === 'string'
      ? { safeAddress: safeAddressOrConfig }
      : { predictedSafe: normalizePredictedSafe(mergeWithDefaultConfig(safeAddressOrConfig)) };

    const safeSDK = await Safe.init({
      provider: provider,
      isL1SafeSingleton: true,
      ...parameters
    });

    // Вызываем getAddress() для валидации конфига
    // Если обязательные поля отсутствуют, это вызовет ошибку
    await safeSDK.getAddress();

    return {
      success: true,
      safeSDK
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
