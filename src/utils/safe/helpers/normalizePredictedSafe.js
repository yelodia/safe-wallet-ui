import { getAddress } from 'viem';

/**
 * Нормализует конфиг predictedSafe:
 * - Сортирует owners по адресу (lowercase)
 * - Нормализует все адреса в checksum формат
 * 
 * @param {Object} predictedSafeConfig - Конфиг Safe { safeAccountConfig, safeDeploymentConfig }
 * @returns {Object} Нормализованный конфиг
 */
export function normalizePredictedSafe(predictedSafeConfig) {
  if (!predictedSafeConfig || typeof predictedSafeConfig !== 'object') {
    return predictedSafeConfig;
  }

  const { safeAccountConfig, safeDeploymentConfig } = predictedSafeConfig;

  if (!safeAccountConfig || typeof safeAccountConfig !== 'object') {
    return predictedSafeConfig;
  }

  // Сортируем owners по адресу (lowercase) и нормализуем адреса
  const normalizedOwners = (safeAccountConfig.owners || [])
    .map(owner => getAddress(owner.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Нормализуем остальные адреса в safeAccountConfig
  const normalizedSafeAccountConfig = {
    ...safeAccountConfig,
    owners: normalizedOwners,
    fallbackHandler: safeAccountConfig.fallbackHandler 
      ? getAddress(safeAccountConfig.fallbackHandler.toLowerCase())
      : safeAccountConfig.fallbackHandler,
    to: safeAccountConfig.to 
      ? getAddress(safeAccountConfig.to.toLowerCase())
      : safeAccountConfig.to,
    paymentToken: safeAccountConfig.paymentToken 
      ? getAddress(safeAccountConfig.paymentToken.toLowerCase())
      : safeAccountConfig.paymentToken,
    paymentReceiver: safeAccountConfig.paymentReceiver 
      ? getAddress(safeAccountConfig.paymentReceiver.toLowerCase())
      : safeAccountConfig.paymentReceiver
  };

  // Нормализуем safeDeploymentConfig: конвертируем saltNonce в строку, если это число
  // SafeSDK использует `||` вместо `??`, поэтому `0` (число) интерпретируется как falsy
  let normalizedSafeDeploymentConfig = safeDeploymentConfig || {};
  if (normalizedSafeDeploymentConfig.saltNonce !== undefined && 
      typeof normalizedSafeDeploymentConfig.saltNonce === 'number') {
    normalizedSafeDeploymentConfig = {
      ...normalizedSafeDeploymentConfig,
      saltNonce: normalizedSafeDeploymentConfig.saltNonce.toString()
    };
  }

  return {
    safeAccountConfig: normalizedSafeAccountConfig,
    safeDeploymentConfig: normalizedSafeDeploymentConfig
  };
}
