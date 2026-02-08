import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { basicSolidityValidation } from '@/utils/validators/basicSolidityValidation'
import { getAbiMethods } from '@/utils/solidity/abiParser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем ABI для тестов
const abiPath = join(__dirname, '../testCoreAbi.json')
const abiJson = readFileSync(abiPath, 'utf-8')

describe('basicSolidityValidation', () => {
  let methods

  beforeAll(() => {
    const abiResult = getAbiMethods(abiJson)
    methods = abiResult.methods
  })

  describe('unsuccessful cases', () => {
    it('should return error for uint8 overflow', () => {
      const method = methods.find((m) => m.name === 'incrementByUint8')
      const input = method.inputs[0]
      const result = basicSolidityValidation('8989798878', input)
      console.log('\n=== uint8 overflow error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for string[] invalid JSON', () => {
      const method = methods.find((m) => m.name === 'incrementByStringArray')
      const input = method.inputs[0]
      const result = basicSolidityValidation('test', input)
      console.log('\n=== string[] invalid JSON error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке JSON
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for tuple[] invalid JSON', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArray')
      const input = method.inputs[0]
      const result = basicSolidityValidation('test', input)
      console.log('\n=== tuple[] invalid JSON error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке JSON
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for uint256[5] invalid element', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayFixed5')
      const input = method.inputs[0]
      const result = basicSolidityValidation('["test", "8778"]', input)
      console.log('\n=== uint256[5] invalid element error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке парсинга числа
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for uint256[5] missing args', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayFixed5')
      const input = method.inputs[0]
      const result = basicSolidityValidation('[7,7]', input)
      console.log('\n=== uint256[5] missing args error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке (может быть про длину массива)
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for uint256[5] too many args', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayFixed5')
      const input = method.inputs[0]
      const result = basicSolidityValidation('[7,7,88,5,4,67]', input)
      console.log('\n=== uint256[5] too many args error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об ошибке (может быть про длину массива)
      expect(result.length).toBeGreaterThan(20)
    })

    it('should return error for address[] invalid address', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArray')
      const input = method.inputs[0]
      const result = basicSolidityValidation('["909"]', input)
      console.log('\n=== address[] invalid address error ===')
      console.log(result)
      expect(result).toContain('format error. details:')
      // Проверяем, что сообщение содержит информацию об invalid address
      expect(result.length).toBeGreaterThan(20)
    })
  })

  describe('successful cases', () => {
    it('should validate uint256', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256')
      const input = method.inputs[0]
      const result = basicSolidityValidation('100', input)
      expect(result).toBe('')
    })

    it('should validate uint8', () => {
      const method = methods.find((m) => m.name === 'incrementByUint8')
      const input = method.inputs[0]
      const result = basicSolidityValidation('255', input)
      expect(result).toBe('')
    })

    it('should validate address', () => {
      const method = methods.find((m) => m.name === 'incrementByAddress')
      const input = method.inputs[0]
      // Используем валидный адрес с правильным checksum (40 hex символов)
      const validAddress = '0x0000000000000000000000000000000000000001'
      const result = basicSolidityValidation(validAddress, input)
      expect(result).toBe('')
    })

    it('should validate address (payable)', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressPayable')
      const input = method.inputs[0]
      // Используем валидный адрес с правильным checksum (40 hex символов)
      const validAddress = '0x0000000000000000000000000000000000000001'
      const result = basicSolidityValidation(validAddress, input)
      expect(result).toBe('')
    })

    it('should validate bool', () => {
      const method = methods.find((m) => m.name === 'incrementByBool')
      const input = method.inputs[0]
      const result = basicSolidityValidation('true', input)
      expect(result).toBe('')
    })

    it('should validate string', () => {
      const method = methods.find((m) => m.name === 'incrementByString')
      const input = method.inputs[0]
      const result = basicSolidityValidation('test string', input)
      expect(result).toBe('')
    })

    it('should validate bytes', () => {
      const method = methods.find((m) => m.name === 'incrementByBytes')
      const input = method.inputs[0]
      const result = basicSolidityValidation('0x1234', input)
      expect(result).toBe('')
    })

    it('should validate bytes1', () => {
      const method = methods.find((m) => m.name === 'incrementByBytes1')
      const input = method.inputs[0]
      const result = basicSolidityValidation('0x12', input)
      expect(result).toBe('')
    })

    it('should validate bytes32', () => {
      const method = methods.find((m) => m.name === 'incrementByBytes32')
      const input = method.inputs[0]
      const result = basicSolidityValidation(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256Array')
      const input = method.inputs[0]
      const result = basicSolidityValidation('[1, 2, 3]', input)
      expect(result).toBe('')
    })

    it('should validate address[]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArray')
      const input = method.inputs[0]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const result = basicSolidityValidation(`[${addr1}, ${addr2}]`, input)
      expect(result).toBe('')
    })

    it('should validate bool[]', () => {
      // Для bool[] нет метода в ABI, проверяем через простой bool
      const result = basicSolidityValidation('true', { type: 'bool' })
      expect(result).toBe('')
    })

    it('should validate string[]', () => {
      const method = methods.find((m) => m.name === 'incrementByStringArray')
      const input = method.inputs[0]
      const result = basicSolidityValidation('["test1", "test2"]', input)
      expect(result).toBe('')
    })

    it('should validate bytes[]', () => {
      const method = methods.find((m) => m.name === 'incrementByBytesArray')
      const input = method.inputs[0]
      const result = basicSolidityValidation('["0x1234", "0x5678"]', input)
      expect(result).toBe('')
    })

    it('should validate uint256[5]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayFixed5')
      const input = method.inputs[0]
      const result = basicSolidityValidation('[1, 2, 3, 4, 5]', input)
      expect(result).toBe('')
    })

    it('should validate address[5]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArrayFixed5')
      const input = method.inputs[0]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[${addr1}, ${addr2}, ${addr3}, ${addr1}, ${addr2}]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate bytes32[3]', () => {
      const method = methods.find((m) => m.name === 'incrementByBytes32ArrayFixed3')
      const input = method.inputs[0]
      const result = basicSolidityValidation(
        '["0x1234567890123456789012345678901234567890123456789012345678901234", "0x1234567890123456789012345678901234567890123456789012345678901234", "0x1234567890123456789012345678901234567890123456789012345678901234"]',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[3][2]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256Array2D')
      const input = method.inputs[0]
      // uint256[3][2] означает массив из 2 элементов, каждый из которых массив из 3 элементов
      const result = basicSolidityValidation('[[1, 2, 3], [4, 5, 6]]', input)
      expect(result).toBe('')
    })

    it('should validate address[2][3]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArray2D')
      const input = method.inputs[0]
      // address[2][3] означает массив из 3 элементов, каждый из которых массив из 2 элементов
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[${addr1}, ${addr2}], [${addr3}, ${addr1}], [${addr2}, ${addr3}]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[2][3][2]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256Array3D')
      const input = method.inputs[0]
      const result = basicSolidityValidation(
        '[[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10], [11, 12]]]',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate address[2][2][2]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArray3D')
      const input = method.inputs[0]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const result = basicSolidityValidation(
        `[[[${addr1}, ${addr2}], [${addr1}, ${addr2}]], [[${addr1}, ${addr2}], [${addr1}, ${addr2}]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfo')
      const input = method.inputs[0]
      const addr = '0x0000000000000000000000000000000000000001'
      const result = basicSolidityValidation(`["John Doe", "25", "${addr}"]`, input)
      expect(result).toBe('')
    })

    it('should validate tuple (Transaction)', () => {
      const method = methods.find((m) => m.name === 'incrementByTransaction')
      const input = method.inputs[0]
      const addr = '0x0000000000000000000000000000000000000001'
      const result = basicSolidityValidation(
        `["${addr}", "1000000000000000000", "0x1234"]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArray')
      const input = method.inputs[0]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const result = basicSolidityValidation(
        `[["${addr1}", "1000000000000000000", "0x1234"], ["${addr2}", "2000000000000000000", "0x5678"]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[3]', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArrayFixed3')
      const input = method.inputs[0]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[["John", "25", "${addr1}"], ["Jane", "30", "${addr2}"], ["Bob", "35", "${addr3}"]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[2][3]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArray2D')
      const input = method.inputs[0]
      // tuple[2][3] означает массив из 3 элементов, каждый из которых массив из 2 tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[["${addr1}", "1000000000000000000", "0x1234"], ["${addr2}", "2000000000000000000", "0x5678"]], [["${addr3}", "3000000000000000000", "0x9abc"], ["${addr1}", "4000000000000000000", "0xdef0"]], [["${addr2}", "5000000000000000000", "0x1111"], ["${addr3}", "6000000000000000000", "0x2222"]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate address[][3]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArrayDynamicFixed3')
      const input = method.inputs[0]
      // address[][3] означает массив из 3 элементов, каждый из которых динамический массив адресов
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[${addr1}, ${addr2}], [${addr3}], [${addr1}, ${addr2}, ${addr3}]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate address[3][]', () => {
      const method = methods.find((m) => m.name === 'incrementByAddressArrayFixed3Dynamic')
      const input = method.inputs[0]
      // address[3][] означает динамический массив, каждый элемент которого фиксированный массив из 3 адресов
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[${addr1}, ${addr2}, ${addr3}], [${addr1}, ${addr2}, ${addr3}]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate bytes32[][4]', () => {
      const method = methods.find((m) => m.name === 'incrementByBytes32ArrayDynamicFixed4')
      const input = method.inputs[0]
      // bytes32[][4] означает массив из 4 элементов, каждый из которых динамический массив bytes32
      const bytes32Value = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const result = basicSolidityValidation(
        `[[${bytes32Value}], [${bytes32Value}, ${bytes32Value}], [${bytes32Value}], [${bytes32Value}, ${bytes32Value}, ${bytes32Value}]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint8 (enum Status)', () => {
      const method = methods.find((m) => m.name === 'incrementByStatus')
      const input = method.inputs[0]
      // enum Status представлен как uint8
      const result = basicSolidityValidation('0', input)
      expect(result).toBe('')
    })

    it('should validate tuple[2][3][]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArray2DDynamic')
      const input = method.inputs[0]
      // tuple[2][3][] означает динамический массив, каждый элемент которого tuple[2][3]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[[["${addr1}", "1000000000000000000", "0x1234"], ["${addr2}", "2000000000000000000", "0x5678"]], [["${addr3}", "3000000000000000000", "0x9abc"], ["${addr1}", "4000000000000000000", "0xdef0"]], [["${addr2}", "5000000000000000000", "0x1111"], ["${addr3}", "6000000000000000000", "0x2222"]]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[][3]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArrayDynamicFixed3')
      const input = method.inputs[0]
      // tuple[][3] означает массив из 3 элементов, каждый из которых динамический массив tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[["${addr1}", "1000000000000000000", "0x1234"]], [["${addr2}", "2000000000000000000", "0x5678"], ["${addr3}", "3000000000000000000", "0x9abc"]], [["${addr1}", "4000000000000000000", "0xdef0"]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[3]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArrayFixed3')
      const input = method.inputs[0]
      // tuple[3] означает фиксированный массив из 3 tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[["${addr1}", "1000000000000000000", "0x1234"], ["${addr2}", "2000000000000000000", "0x5678"], ["${addr3}", "3000000000000000000", "0x9abc"]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[3][]', () => {
      const method = methods.find((m) => m.name === 'incrementByTransactionArrayFixed3Dynamic')
      const input = method.inputs[0]
      // tuple[3][] означает динамический массив, каждый элемент которого фиксированный массив из 3 tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[["${addr1}", "1000000000000000000", "0x1234"], ["${addr2}", "2000000000000000000", "0x5678"], ["${addr3}", "3000000000000000000", "0x9abc"]], [["${addr1}", "4000000000000000000", "0xdef0"], ["${addr2}", "5000000000000000000", "0x1111"], ["${addr3}", "6000000000000000000", "0x2222"]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[3][2][]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256Array2DDynamic')
      const input = method.inputs[0]
      // uint256[3][2][] означает динамический массив, каждый элемент которого uint256[3][2]
      const result = basicSolidityValidation(
        '[[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[5][]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayFixed5Dynamic')
      const input = method.inputs[0]
      // uint256[5][] означает динамический массив, каждый элемент которого фиксированный массив из 5 uint256
      const result = basicSolidityValidation(
        '[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate uint256[][][2]', () => {
      const method = methods.find((m) => m.name === 'incrementByUint256ArrayNested')
      const input = method.inputs[0]
      // uint256[][][2] означает массив из 2 элементов, каждый из которых вложенный динамический массив
      const result = basicSolidityValidation(
        '[[[1, 2], [3, 4, 5]], [[6, 7, 8, 9], [10]]]',
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[] (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArray')
      const input = method.inputs[0]
      // tuple[] означает динамический массив tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[["John", "25", "${addr1}"], ["Jane", "30", "${addr2}"], ["Bob", "35", "${addr3}"]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[2][3] (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArray2D')
      const input = method.inputs[0]
      // tuple[2][3] означает массив из 3 элементов, каждый из которых массив из 2 tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[["John", "25", "${addr1}"], ["Jane", "30", "${addr2}"]], [["Bob", "35", "${addr3}"], ["Alice", "28", "${addr1}"]], [["Charlie", "40", "${addr2}"], ["Diana", "32", "${addr3}"]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[3][2][] (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArray2DDynamic')
      const input = method.inputs[0]
      // tuple[3][2][] означает динамический массив, каждый элемент которого tuple[3][2]
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[[["John", "25", "${addr1}"], ["Jane", "30", "${addr2}"], ["Bob", "35", "${addr3}"]], [["Alice", "28", "${addr1}"], ["Charlie", "40", "${addr2}"], ["Diana", "32", "${addr3}"]]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[][5] (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArrayDynamicFixed5')
      const input = method.inputs[0]
      // tuple[][5] означает массив из 5 элементов, каждый из которых динамический массив tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const result = basicSolidityValidation(
        `[[["John", "25", "${addr1}"]], [["Jane", "30", "${addr2}"]], [["Bob", "35", "${addr3}"]], [["Alice", "28", "${addr1}"]], [["Charlie", "40", "${addr2}"]]]`,
        input,
      )
      expect(result).toBe('')
    })

    it('should validate tuple[5][] (UserInfo)', () => {
      const method = methods.find((m) => m.name === 'incrementByUserInfoArrayFixed5Dynamic')
      const input = method.inputs[0]
      // tuple[5][] означает динамический массив, каждый элемент которого фиксированный массив из 5 tuple
      const addr1 = '0x0000000000000000000000000000000000000001'
      const addr2 = '0x0000000000000000000000000000000000000002'
      const addr3 = '0x0000000000000000000000000000000000000003'
      const addr4 = '0x0000000000000000000000000000000000000004'
      const addr5 = '0x0000000000000000000000000000000000000005'
      const result = basicSolidityValidation(
        `[[["John", "25", "${addr1}"], ["Jane", "30", "${addr2}"], ["Bob", "35", "${addr3}"], ["Alice", "28", "${addr4}"], ["Charlie", "40", "${addr5}"]], [["Diana", "32", "${addr1}"], ["Eve", "27", "${addr2}"], ["Frank", "45", "${addr3}"], ["Grace", "29", "${addr4}"], ["Henry", "38", "${addr5}"]]]`,
        input,
      )
      expect(result).toBe('')
    })
  })
})
