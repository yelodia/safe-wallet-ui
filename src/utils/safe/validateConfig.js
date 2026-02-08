import { getAddress } from 'viem';
import { predictSafeAddress } from './predictAddress';

/**
 * Проверяет, соответствует ли конфиг predictedSafe ожидаемому адресу
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {Object} predictedSafeConfig - Конфиг Safe { safeAccountConfig, safeDeploymentConfig }
 * @param {string} expectedAddress - Ожидаемый адрес Safe
 * @returns {Promise<boolean>} true если адреса совпадают, false если не совпадают или ошибка
 */
export async function validateSafeConfig(provider, predictedSafeConfig, expectedAddress) {
  if (!provider || !predictedSafeConfig || !expectedAddress) {
    return false;
  }

  const result = await predictSafeAddress(provider, predictedSafeConfig);

  if (!result.success) {
    console.error('Error validating Safe config:', result.error);
    return false;
  }

  const normalizedComputed = getAddress(result.data);
  const normalizedExpected = getAddress(expectedAddress);

  return normalizedComputed === normalizedExpected;
}
