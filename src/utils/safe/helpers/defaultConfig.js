/**
 * Конфиг по умолчанию для Safe
 * Используется для заполнения опциональных полей при работе с минимальным конфигом
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const EMPTY_DATA = '0x';

/**
 * Конфиг по умолчанию для safeAccountConfig
 */
export const DEFAULT_SAFE_ACCOUNT_CONFIG = {
  to: ZERO_ADDRESS,
  data: EMPTY_DATA,
  fallbackHandler: ZERO_ADDRESS,
  paymentToken: ZERO_ADDRESS,
  payment: 0,
  paymentReceiver: ZERO_ADDRESS
};

/**
 * Конфиг по умолчанию для safeDeploymentConfig
 * 
 * ВАЖНО: saltNonce должен быть строкой, а не числом!
 * SafeSDK использует `||` вместо `??`, поэтому `0` (число) интерпретируется как falsy
 * и заменяется на getChainSpecificDefaultSaltNonce.
 * Строка "0" корректно обрабатывается.
 */
export const DEFAULT_SAFE_DEPLOYMENT_CONFIG = {
  saltNonce: '0', // Строка, а не число!
  safeVersion: '1.4.1',
  deploymentType: 'canonical'
};

/**
 * Склеивает переданный конфиг с конфигом по умолчанию
 * @param {Object} predictedSafeConfig - Конфиг Safe { safeAccountConfig?, safeDeploymentConfig? }
 * @returns {Object} Конфиг с заполненными значениями по умолчанию
 */
export function mergeWithDefaultConfig(predictedSafeConfig) {
  return {
    safeAccountConfig: {
      ...DEFAULT_SAFE_ACCOUNT_CONFIG,
      ...(predictedSafeConfig.safeAccountConfig || {})
    },
    safeDeploymentConfig: {
      ...DEFAULT_SAFE_DEPLOYMENT_CONFIG,
      ...(predictedSafeConfig.safeDeploymentConfig || {})
    }
  };
}
