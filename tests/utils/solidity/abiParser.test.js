import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getAbiMethods } from '@/utils/solidity/abiParser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем ABI для тестов
const abiPath = join(__dirname, '../testCoreAbi.json')
const abiJson = readFileSync(abiPath, 'utf-8')

describe('abiParser', () => {
  let abiResult

  beforeAll(() => {
    abiResult = getAbiMethods(abiJson)
  })

  describe('getAbiMethods', () => {
    it('should return 45 methods', () => {
      expect(abiResult.methods).toHaveLength(45)
    })

    it('should return correct method names', () => {
      const methodNames = abiResult.methods.map((m) => m.name).sort()

      const expectedNames = [
        'incrementByAddress',
        'incrementByAddressArray',
        'incrementByAddressArray2D',
        'incrementByAddressArray3D',
        'incrementByAddressArrayDynamicFixed3',
        'incrementByAddressArrayFixed3Dynamic',
        'incrementByAddressArrayFixed5',
        'incrementByAddressPayable',
        'incrementByBool',
        'incrementByBytes',
        'incrementByBytes1',
        'incrementByBytes32',
        'incrementByBytes32ArrayDynamicFixed4',
        'incrementByBytes32ArrayFixed3',
        'incrementByBytesArray',
        'incrementByStatus',
        'incrementByString',
        'incrementByStringArray',
        'incrementByTransaction',
        'incrementByTransactionArray',
        'incrementByTransactionArray2D',
        'incrementByTransactionArray2DDynamic',
        'incrementByTransactionArrayDynamicFixed3',
        'incrementByTransactionArrayFixed3',
        'incrementByTransactionArrayFixed3Dynamic',
        'incrementByUint256',
        'incrementByUint256Array',
        'incrementByUint256Array2D',
        'incrementByUint256Array2DDynamic',
        'incrementByUint256Array3D',
        'incrementByUint256ArrayFixed5',
        'incrementByUint256ArrayFixed5Dynamic',
        'incrementByUint256ArrayNested',
        'incrementByUint8',
        'incrementByUserInfo',
        'incrementByUserInfoArray',
        'incrementByUserInfoArray2D',
        'incrementByUserInfoArray2DDynamic',
        'incrementByUserInfoArrayDynamicFixed5',
        'incrementByUserInfoArrayFixed3',
        'incrementByUserInfoArrayFixed5Dynamic',
        'renounceOwnership',
        'setSigner',
        'transferOwnership',
        'withdraw',
      ].sort()

      expect(methodNames).toEqual(expectedNames)
    })

    it('should set payable to true for incrementByAddressPayable', () => {
      const method = abiResult.methods.find((m) => m.name === 'incrementByAddressPayable')
      expect(method).toBeDefined()
      expect(method.payable).toBe(true)
    })
  })
})
