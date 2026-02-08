import {
  keccak256,
  concat,
  getContractAddress,
  getAddress,
  encodeAbiParameters,
  encodeFunctionData
} from 'viem';
import { getProxyFactoryDeployments, getSafeSingletonDeployments } from '@safe-global/safe-deployments';
import { getChainIdFromProvider } from './helpers/provider';
import { getProxyCreationCode, addProxyCreationCode } from './config/proxyCreationCode';
import { normalizePredictedSafe } from './helpers/normalizePredictedSafe';
import { mergeWithDefaultConfig } from './helpers/defaultConfig';

// ---------------- Упрощённый SafeProvider ---------------- 

class SimpleSafeProvider {
  constructor({ chainId }) {
    this.chainId = BigInt(chainId);
  }

  /**
   * Аналог safeProvider.encodeParameters(type, values)
   * В SDK это обёртка над ABI-энкодером.
   */
  encodeParameters(type, values) {
    return encodeAbiParameters([{ type }], values);
  }

  /**
   * Аналог safeProvider.getChecksummedAddress(address)
   */
  getChecksummedAddress(address) {
    return getAddress(address);
  }
}

/**
 * В SDK getSafeContract выбирает правильный класс SafeContract_vX_Y_Z
 * и возвращает обёртку с ABI и адресом.
 *
 * Здесь мы возвращаем только то, что нам нужно:
 * - getAddress()
 * - abi метода setup(...)
 */
function simpleGetSafeContract(singletonAddress) {
  const SAFE_SETUP_ABI = [
    {
      type: 'function',
      name: 'setup',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'owners', type: 'address[]' },
        { name: 'threshold', type: 'uint256' },
        { name: 'to', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'fallbackHandler', type: 'address' },
        { name: 'paymentToken', type: 'address' },
        { name: 'payment', type: 'uint256' },
        { name: 'paymentReceiver', type: 'address' }
      ],
      outputs: []
    }
  ];

  return {
    getAddress: () => singletonAddress,
    abi: SAFE_SETUP_ABI
  };
}

/**
 * В SDK encodeSetupCallData:
 * - валидирует safeAccountConfig
 * - берёт ABI из safeContract
 * - кодирует вызов setup(...)
 *
 * Здесь мы делаем только кодирование.
 * Функция полностью синхронная, async не нужен.
 */
function simpleEncodeSetupCallData({ safeAccountConfig, safeContract }) {
  const { owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver } =
    safeAccountConfig;

  const initializer = encodeFunctionData({
    abi: safeContract.abi,
    functionName: 'setup',
    args: [owners, BigInt(threshold), to, data, fallbackHandler, paymentToken, BigInt(payment), paymentReceiver]
  });

  return initializer;
}

/**
 * Получает proxyCreationCode из конфига по версии Safe и chainId
 * 
 * @param {string} safeVersion - Версия Safe (например, '1.4.1')
 * @param {string} chainId - Chain ID сети (например, '11155111')
 * @returns {string|undefined} proxyCreationCode (hex строка) или undefined, если не найден
 */
function getProxyCreationCodeFromConfig(safeVersion, chainId) {
  // Получаем адрес фабрики из библиотеки деплойментов (без RPC)
  const factoryDeployment = getProxyFactoryDeployments({
    version: safeVersion,
    network: chainId.toString(),
    released: true
  });

  if (!factoryDeployment || !factoryDeployment.networkAddresses) {
    return undefined;
  }

  const factoryAddress = factoryDeployment.networkAddresses[chainId.toString()];
  if (!factoryAddress) {
    return undefined;
  }

  // Ищем proxyCreationCode в конфиге по адресу фабрики
  return getProxyCreationCode(factoryAddress);
}

/**
 * Получает proxyCreationCode через RPC запрос к SafeProxyFactory
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {string} safeVersion - Версия Safe
 * @param {string} deploymentType - Тип деплоймента ('canonical' | 'custom')
 * @returns {Promise<string>} proxyCreationCode (hex строка)
 */
async function getProxyCreationCodeFromRPC(provider, safeVersion, deploymentType = 'canonical') {
  const { SafeProvider: SafeProviderSDK, getSafeProxyFactoryContract } = await import('@safe-global/protocol-kit');
  
  const safeProviderSDK = await SafeProviderSDK.init({
    provider: provider,
    safeVersion: safeVersion
  });

  const factoryContract = await getSafeProxyFactoryContract({
    safeProvider: safeProviderSDK,
    safeVersion,
    customContracts: undefined,
    deploymentType
  });

  const proxyCreationCodeArray = await factoryContract.proxyCreationCode();
  const [code] = proxyCreationCodeArray;
  
  return code;
}

/**
 * Вычисляет адрес Safe через CREATE2 без RPC запросов (где возможно)
 * 
 * @param {string|import('viem').PublicClient|import('@web3-onboard/common').EIP1193Provider} provider - Провайдер
 * @param {Object} predictedSafeConfig - Конфиг Safe { safeAccountConfig, safeDeploymentConfig }
 * @returns {Promise<string>} Вычисленный адрес Safe
 * @throws {Error} Если не удалось вычислить адрес
 */
export async function predictSafeAddress(provider, predictedSafeConfig) {
  if (!provider || !predictedSafeConfig) {
    return {
      success: false,
      error: new Error('Provider and predictedSafeConfig are required')
    };
  }

  try {
    // Склеиваем переданный конфиг с конфигом по умолчанию
    const mergedConfig = mergeWithDefaultConfig(predictedSafeConfig);

    // Нормализуем конфиг (сортировка owners, нормализация адресов)
    const normalizedConfig = normalizePredictedSafe(mergedConfig);
    const { safeAccountConfig, safeDeploymentConfig } = normalizedConfig;
    
    if (!safeAccountConfig || !safeDeploymentConfig) {
      return {
        success: false,
        error: new Error('safeAccountConfig and safeDeploymentConfig are required in predictedSafeConfig')
      };
    }

    const { safeVersion, saltNonce } = safeDeploymentConfig;

    // Получаем chainId из провайдера
    const chainId = await getChainIdFromProvider(provider);
    if (!chainId) {
      return {
        success: false,
        error: new Error('Failed to get chainId from provider')
      };
    }

    // Создаем SimpleSafeProvider
    const safeProvider = new SimpleSafeProvider({ chainId });

    // Получаем адрес singleton из библиотеки деплойментов (без RPC)
    const singletonDeployment = getSafeSingletonDeployments({
      version: safeVersion,
      network: chainId.toString(),
      released: true
    });

    if (!singletonDeployment || !singletonDeployment.networkAddresses) {
      return {
        success: false,
        error: new Error(`Singleton not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    const singletonAddress = singletonDeployment.networkAddresses[chainId.toString()];
    if (!singletonAddress) {
      return {
        success: false,
        error: new Error(`Singleton address not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    // Получаем «контракт» Safe (только адрес + ABI)
    const safeContract = simpleGetSafeContract(singletonAddress);

    // Строим initializer (setup call data)
    const initializer = simpleEncodeSetupCallData({
      safeAccountConfig,
      safeContract
    });

    // Считаем salt так же, как в SDK
    const asHex = (hex) => (hex.startsWith('0x') ? hex : `0x${hex}`);

    const initializerHash = keccak256(asHex(initializer));
    const encodedNonce = asHex(safeProvider.encodeParameters('uint256', [BigInt(saltNonce || 0)]));
    const salt = keccak256(concat([initializerHash, encodedNonce]));

    // Получаем адрес фабрики из библиотеки деплойментов (без RPC)
    const factoryDeployment = getProxyFactoryDeployments({
      version: safeVersion,
      network: chainId.toString(),
      released: true
    });

    if (!factoryDeployment || !factoryDeployment.networkAddresses) {
      return {
        success: false,
        error: new Error(`Factory not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    const factoryAddress = factoryDeployment.networkAddresses[chainId.toString()];
    if (!factoryAddress) {
      return {
        success: false,
        error: new Error(`Factory address not found for version ${safeVersion} and chain ${chainId}`)
      };
    }

    // Получаем proxyCreationCode: сначала из конфига, если не найден - через RPC
    let proxyCreationCode = getProxyCreationCodeFromConfig(safeVersion, chainId);

    if (!proxyCreationCode) {
      // Если не найден в конфиге, получаем через RPC
      proxyCreationCode = await getProxyCreationCodeFromRPC(
        provider,
        safeVersion,
        safeDeploymentConfig.deploymentType || 'canonical'
      );

      // Кешируем в конфиг для будущих вызовов
      addProxyCreationCode(factoryAddress, proxyCreationCode);
    }

    // Формируем initCode: proxyCreationCode + encode(address singleton)
    const singletonInput = safeProvider.encodeParameters('address', [safeContract.getAddress()]);
    const initCode = concat([proxyCreationCode, asHex(singletonInput)]);

    // Адрес через CREATE2 (viem.getContractAddress)
    const rawAddress = getContractAddress({
      from: factoryAddress,
      bytecode: initCode,
      opcode: 'CREATE2',
      salt
    });

    const checksummedAddress = safeProvider.getChecksummedAddress(rawAddress);

    return {
      success: true,
      data: checksummedAddress
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
