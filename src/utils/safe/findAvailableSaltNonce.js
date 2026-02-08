import { predictSafeAddress } from './predictAddress';
import { isContractDeployed } from './checkDeployment';

/**
 * Находит доступный saltNonce для Safe
 * Перебирает saltNonce начиная с переданного в predictedSafe (или 0), вычисляет адрес и проверяет деплоймент
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {Object} predictedSafe - Объект с safeAccountConfig и safeDeploymentConfig
 * @param {Object} [options] - Опциональные параметры
 * @param {number} [options.maxAttempts=100] - Максимум попыток поиска
 * @returns {Promise<{success: boolean, data?: {saltNonce: number, address: string, attempts: number, startAddress?: string}, error?: Error}>} Результат поиска
 */
export async function findAvailableSaltNonce(provider, predictedSafe, options = {}) {
  try {
    if (!provider) {
      return {
        success: false,
        error: new Error('Provider is required')
      };
    }

    if (!predictedSafe || !predictedSafe.safeAccountConfig || !predictedSafe.safeDeploymentConfig) {
      return {
        success: false,
        error: new Error('predictedSafe with safeAccountConfig and safeDeploymentConfig is required')
      };
    }

    const { maxAttempts = 100 } = options;

    // Определяем начальный saltNonce из predictedSafe или 0
    const startNonce = predictedSafe.safeDeploymentConfig?.saltNonce ?? 0;
    let testNonce = startNonce;
    let attempts = 0;
    let startAddress = null; // Адрес для начального nonce

    while (attempts < maxAttempts) {
      attempts++;

      // Создаем копию predictedSafe с обновленным saltNonce
      const testPredictedSafe = {
        safeAccountConfig: { ...predictedSafe.safeAccountConfig },
        safeDeploymentConfig: {
          ...predictedSafe.safeDeploymentConfig,
          saltNonce: testNonce
        }
      };

      // Вычисляем адрес для текущего nonce
      const addressResult = await predictSafeAddress(provider, testPredictedSafe);
      
      if (!addressResult.success) {
        // Если не удалось вычислить адрес, пробуем следующий nonce
        testNonce++;
        continue;
      }

      const computedAddress = addressResult.data;

      // Сохраняем адрес для начального nonce
      if (testNonce === startNonce) {
        startAddress = computedAddress;
      }

      // Проверяем, задеплоен ли контракт по этому адресу
      const isDeployed = await isContractDeployed(provider, computedAddress);

      // Если адрес не задеплоен, возвращаем этот nonce
      if (!isDeployed) {
        return {
          success: true,
          data: {
            saltNonce: testNonce,
            address: computedAddress,
            attempts: attempts,
            startAddress: startAddress // Адрес для начального nonce
          }
        };
      }

      // Если задеплоен, пробуем следующий nonce
      testNonce++;
    }

    return {
      success: false,
      error: new Error(`Could not find available saltNonce after ${maxAttempts} attempts`)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
