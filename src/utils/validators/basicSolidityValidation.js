/**
 * Утилита для валидации значений Solidity типов
 * Использует viem вместо web3-eth-abi
 */

import { encodeAbiParameters } from 'viem'
import { parseInputValue } from '../solidity/parseInputValue'

/**
 * Валидирует значение для Solidity типа
 * @param {string} value - Значение для валидации
 * @param {Object} input - Объект input из ABI
 * @param {string} input.type - Тип параметра
 * @param {Array} [input.components] - Компоненты для tuple
 * @returns {string} - Пустая строка при успехе, строка ошибки при неудаче
 */
export function basicSolidityValidation(value, input) {
  try {
    const cleanValue = parseInputValue(input.type, value)

    const abiParameter = formatAbiParameterForViem(input)

    encodeAbiParameters([abiParameter], [cleanValue])
  } catch (error) {
    let errorMessage = error?.toString()

    if (error?.message) {
      errorMessage = error.message
    }

    const versionIndex = errorMessage.indexOf('Version: viem@')
    if (versionIndex !== -1) {
      errorMessage = errorMessage.slice(0, versionIndex).trim()
    }

    return `format error. details: ${errorMessage}`
  }

  return ''
}

/**
 * Форматирует объект input из ABI в формат параметра для viem
 * @param {Object} input - Объект input из ABI
 * @returns {Object} - Параметр в формате viem
 */
function formatAbiParameterForViem(input) {
  if (input.type.startsWith('tuple')) {
    const parameter = {
      type: input.type,
    }

    if (input.components && input.components.length > 0) {
      parameter.components = input.components.map((component) =>
        formatAbiParameterForViem(component),
      )
    }

    return parameter
  }

  return {
    type: input.type,
  }
}
