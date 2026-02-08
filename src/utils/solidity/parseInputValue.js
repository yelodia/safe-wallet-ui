/**
 * Утилита для парсинга значений Solidity типов
 * Адаптирована для использования с viem (BigInt вместо toBN)
 */

// ==================== Типы и константы ====================

const BOOLEAN_FIELD_TYPE = 'bool'
const STRING_FIELD_TYPE = 'string'

// int<M> or uint<M>
const intFieldTypeRegex = new RegExp(
  /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/,
)

// <type>[] or <type>[size]
const arrayFieldTypeRegex = new RegExp(/[^\]](\[([1-9]+[0-9]*)?\])$/)

// <type>[][], <type>[size][], <type>[][size] or <type>[size][size]
const matrixFieldTypeRegex = new RegExp(/[^\]]((\[([1-9]+[0-9]*)?\]){2,2})$/)

// <type>[][][][]...,  <type>[][size][][size][][size]..., <type>[size][size][size][size]...
const multiDimensionalArrayFieldTypeRegex = new RegExp(/[^\]]((\[([1-9]+[0-9]*)?\]){3,})$/)

// Types can be combined to a tuple
const tupleFieldTypeRegex = new RegExp(/^tuple/)

const baseFieldtypeRegex = new RegExp(/^([a-zA-Z0-9]*)(((\[\])|(\[[1-9]+[0-9]*\]))*)?$/)

// ==================== Функции определения типов ====================

function isBooleanFieldType(fieldType) {
  return fieldType === BOOLEAN_FIELD_TYPE
}

function isIntFieldType(fieldType) {
  return intFieldTypeRegex.test(fieldType)
}

function isTupleFieldType(fieldType) {
  return tupleFieldTypeRegex.test(fieldType)
}

function isArrayFieldType(fieldType) {
  return arrayFieldTypeRegex.test(fieldType)
}

function isMatrixFieldType(fieldType) {
  return matrixFieldTypeRegex.test(fieldType)
}

function isMultiDimensionalArrayFieldType(fieldType) {
  return multiDimensionalArrayFieldTypeRegex.test(fieldType)
}

function isArrayOfStringsFieldType(fieldType) {
  return fieldType.startsWith(STRING_FIELD_TYPE) && isArrayFieldType(fieldType)
}

function isMatrixOfStringsFieldType(fieldType) {
  return fieldType.startsWith(STRING_FIELD_TYPE) && isMatrixFieldType(fieldType)
}

function isMultiDimensionalArrayOfStringsFieldType(fieldType) {
  return fieldType.startsWith(STRING_FIELD_TYPE) && isMultiDimensionalArrayFieldType(fieldType)
}

// ==================== Вспомогательные функции ====================

class SoliditySyntaxError extends Error {}

/**
 * Возвращает количество бит для типа int/uint
 */
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)(((\[\])|(\[[1-9]+[0-9]*\]))*)?$/)
function getNumberOfBits(fieldType) {
  return Number(fieldType.match(paramTypeNumber)?.[2] || '256')
}

/**
 * Возвращает базовый тип поля
 * Пример: из "uint128[][2][]" возвращает "uint128"
 */
function getBaseFieldType(fieldType) {
  const baseFieldType = fieldType.match(baseFieldtypeRegex)?.[1]

  if (!baseFieldType) {
    throw new SoliditySyntaxError(`Unknow base field type ${baseFieldType} from ${fieldType}`)
  }

  return baseFieldType
}

/**
 * Проверяет, является ли строка массивом
 */
function isArray(values) {
  const trimmedValue = values.trim()
  return trimmedValue.startsWith('[') && trimmedValue.endsWith(']')
}

// ==================== Функции парсинга ====================

/**
 * Парсит boolean значение
 */
function parseBooleanValue(value) {
  const isStringValue = typeof value === 'string'
  if (isStringValue) {
    const truthyStrings = ['true', 'True', 'TRUE', '1']
    const isTruthyValue = truthyStrings.some(
      (truthyString) => truthyString === value.trim().toLowerCase(),
    )

    if (isTruthyValue) {
      return true
    }

    const falsyStrings = ['false', 'False', 'FALSE', '0']
    const isFalsyValue = falsyStrings.some(
      (falsyString) => falsyString === value.trim().toLowerCase(),
    )

    if (isFalsyValue) {
      return false
    }

    throw new SoliditySyntaxError('Invalid Boolean value')
  }

  return !!value
}

/**
 * Парсит int/uint значение с преобразованием в BigInt для viem
 */
function parseIntValue(value, fieldType) {
  const trimmedValue = value.replace(/"/g, '').replace(/'/g, '').trim()
  const isEmptyString = trimmedValue === ''

  if (isEmptyString) {
    throw new SoliditySyntaxError('invalid empty strings for integers')
  }

  try {
    return BigInt(trimmedValue)
  } catch (error) {
    throw new SoliditySyntaxError(`Invalid integer value: ${trimmedValue}`)
  }
}

/**
 * Парсит строку в массив
 * Пример: из "[1, 2, [3,4]]" возвращает [ "1", "2", "[3, 4]" ]
 * Используется только для массивов ints, uints, bytes, addresses и booleans
 * НЕ использовать для массивов строк (для строк использовать JSON.parse)
 */
function parseStringToArray(value) {
  let numberOfItems = 0
  let numberOfOtherArrays = 0
  return value
    .trim()
    .slice(1, -1) // remove the first "[" and the last "]"
    .split('')
    .reduce((array, char) => {
      const isCommaChar = char === ','

      if (isCommaChar && numberOfOtherArrays === 0) {
        numberOfItems++
        return array
      }

      const isOpenArrayChar = char === '['

      if (isOpenArrayChar) {
        numberOfOtherArrays++
      }

      const isCloseArrayChar = char === ']'

      if (isCloseArrayChar) {
        numberOfOtherArrays--
      }

      array[numberOfItems] = `${array[numberOfItems] || ''}${char}`.trim()

      return array
    }, [])
}

/**
 * Рекурсивно парсит массив значений
 */
function parseArrayOfValues(values, fieldType) {
  if (!isArray(values)) {
    throw new SoliditySyntaxError('Invalid Array value')
  }

  return parseStringToArray(values).map((itemValue) =>
    isArray(itemValue)
      ? parseArrayOfValues(itemValue, fieldType) // recursive call because Matrix and MultiDimensional Arrays field types
      : parseInputValue(
          // recursive call to parseInputValue
          getBaseFieldType(fieldType), // based on the base field type
          itemValue.replace(/"/g, '').replace(/'/g, ''), // removing " and ' chars from the value
        ),
  )
}

/**
 * Главная функция парсинга значений Solidity типов
 * @param {string} fieldType - Тип поля (например, "uint256", "address[]", "tuple(...)")
 * @param {string} value - Значение для парсинга
 * @returns {any} - Распарсенное значение
 */
export function parseInputValue(fieldType, value) {
  const trimmedValue = typeof value === 'string' ? value.trim() : value

  if (isBooleanFieldType(fieldType)) {
    return parseBooleanValue(trimmedValue)
  }

  if (isIntFieldType(fieldType)) {
    return parseIntValue(trimmedValue, fieldType)
  }

  if (isTupleFieldType(fieldType)) {
    return JSON.parse(trimmedValue)
  }

  if (
    isArrayOfStringsFieldType(fieldType) ||
    isMatrixOfStringsFieldType(fieldType) ||
    isMultiDimensionalArrayOfStringsFieldType(fieldType)
  ) {
    return JSON.parse(trimmedValue)
  }

  if (
    isArrayFieldType(fieldType) ||
    isMatrixFieldType(fieldType) ||
    isMultiDimensionalArrayFieldType(fieldType)
  ) {
    return parseArrayOfValues(trimmedValue, fieldType)
  }

  return value
}
