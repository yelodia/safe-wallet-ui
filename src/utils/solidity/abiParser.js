/**
 * Утилита для парсинга ABI контрактов
 */

 import { decodeFunctionData } from 'viem'

/**
 * Сериализует значение, конвертируя BigInt в строки
 * @param {any} value - Значение для сериализации
 * @returns {any} - Сериализованное значение
 */
function serializeValue(value) {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item))
  }

  if (typeof value === 'object') {
    const result = {}
    for (const key in value) {
      result[key] = serializeValue(value[key])
    }
    return result
  }

  return value
}

/**
 * Декодирует данные транзакции и возвращает имя метода и массив инпутов
 * @param {Object} abi - Объект ABI метода (с полями name, inputs и т.д.)
 * @param {string} data - Hex строка с данными транзакции
 * @returns {{ functionName: string, inputs: Array<{ name: string, type: string, value: any }> }}
 */
export function decodeMethodInputs(abi, data) {
  try {
    const decodedData = decodeFunctionData({
      abi: [abi],
      data
    })

    const inputs = (abi.inputs || []).map((input, index) => {
      const value = decodedData.args?.[index]
      return {
        name: input?.name || `param${index}`,
        type: input?.type || '',
        value: serializeValue(value)
      }
    })

    return {
      functionName: decodedData.functionName || '',
      inputs
    }
  } catch (error) {
    console.error('Error decoding function data:', error)
    return {
      functionName: '',
      inputs: []
    }
  }
}

/**
 * Парсит ABI и возвращает массив методов
 * @param {string} abi - JSON строка с ABI контракта
 * @returns {{ methods: Array<{ inputs: Array, name: string, payable: boolean }> }}
 */
export function getAbiMethods(abi) {
  let parsedAbi

  try {
    parsedAbi = JSON.parse(abi)
  } catch {
    return { methods: [] }
  }

  if (!Array.isArray(parsedAbi)) {
    return { methods: [] }
  }

  const _isMethodPayable = (m) => m.payable || m.stateMutability === 'payable'

  const methods = parsedAbi
    .filter((e) => {
      if (Object.keys(e).length === 0) {
        return false
      }

      if (['pure', 'view'].includes(e.stateMutability)) {
        return false
      }

      if (e.type === 'fallback' && e.stateMutability === 'nonpayable') {
        return false
      }

      if (e?.type?.toLowerCase() === 'event') {
        return false
      }

      if (e?.type?.toLowerCase() === 'error') {
        return false
      }

      return !e.constant
    })
    .filter((m) => m.type !== 'constructor')
    .map((m) => {
      return {
        inputs: m.inputs || [],
        name: m.name || (m.type === 'fallback' ? 'fallback' : 'receive'),
        stateMutability: m.stateMutability,
        outputs: m.outputs || [],
        type: m.type,
        payable: _isMethodPayable(m),
      }
    })

  return { methods }
}

