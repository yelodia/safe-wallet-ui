/**
 * Динамический конфиг proxyCreationCode для различных фабрик Safe
 * 
 * Импортирует статический конфиг из @/config/proxyCreationCode и позволяет
 * динамически добавлять новые записи во время выполнения (например, при получении через RPC)
 * 
 * Ключ: адрес фабрики (lowercase для нормализации)
 * Значение: proxyCreationCode (полученный через factory.proxyCreationCode())
 */

import { PROXY_CREATION_CODE_CONFIG as STATIC_CONFIG } from '@/config/proxyCreationCode';

// Динамический конфиг, инициализируется статическим конфигом
const dynamicConfig = { ...STATIC_CONFIG };

// Экспортируем динамический конфиг для чтения
export const PROXY_CREATION_CODE_CONFIG = dynamicConfig;

/**
 * Добавляет proxyCreationCode в конфиг
 * @param {string} factoryAddress - Адрес фабрики (будет нормализован в lowercase)
 * @param {string} code - proxyCreationCode (hex строка)
 */
export function addProxyCreationCode(factoryAddress, code) {
  if (!factoryAddress || !code) {
    throw new Error('Factory address and code are required');
  }
  
  const normalizedAddress = factoryAddress.toLowerCase();
  dynamicConfig[normalizedAddress] = code;
}

/**
 * Получает proxyCreationCode из конфига
 * @param {string} factoryAddress - Адрес фабрики (будет нормализован в lowercase)
 * @returns {string|undefined} proxyCreationCode или undefined, если не найден
 */
export function getProxyCreationCode(factoryAddress) {
  if (!factoryAddress) {
    return undefined;
  }
  
  const normalizedAddress = factoryAddress.toLowerCase();
  return dynamicConfig[normalizedAddress];
}
