import { formatAbiParameter } from 'abitype'

/**
 * Генерирует строку правил валидации для Solidity-параметра
 * @param {Object} input - ABI input объект ({ type, name, components? })
 * @returns {string} строка правил vee-validate
 */
export function getInputValidationRules(input) {
  const rules = []

  if (!input || !input.type) {
    return ''
  }

  if (input.type === 'address') {
    rules.push('isAddress')
  }

  if (input.type === 'bool') {
    rules.push('isBoolean')
  }

  const formattedParam = formatAbiParameter(input)
  rules.push(`isSolidityInpit:${formattedParam}`)

  return rules.join('|')
}

