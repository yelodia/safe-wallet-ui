import { describe, it, expect } from 'vitest';
import { isAddress } from 'viem';
import { findAvailableSaltNonce } from '@/utils/safe/findAvailableSaltNonce';
import { isContractDeployed } from '@/utils/safe/checkDeployment';
import {
    SEPOLIA_RPC_URL,
    fullSafeAccountConfig,
    fullSafeDeploymentConfig
} from './testData';

describe('findAvailableSaltNonce', () => {
    it('should find available saltNonce = 1 for fullSafeAccountConfig + fullSafeDeploymentConfig on Sepolia', async () => {
        const predictedSafe = {
            safeAccountConfig: fullSafeAccountConfig,
            safeDeploymentConfig: fullSafeDeploymentConfig  // saltNonce: 0
        };

        const result = await findAvailableSaltNonce(
            SEPOLIA_RPC_URL,
            predictedSafe
        );

        // Проверяем успешность выполнения
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        // Проверяем, что saltNonce = 1 (так как с saltNonce = 0 адрес уже задеплоен)
        expect(result.data.saltNonce).toBe(1);

        // Проверяем, что address - валидный адрес
        expect(result.data.address).toBeDefined();
        expect(isAddress(result.data.address)).toBe(true);

        // Проверяем, что attempts >= 2 (минимум 2 попытки: nonce 0 занят, nonce 1 свободен)
        expect(result.data.attempts).toBeGreaterThanOrEqual(2);

        // Проверяем, что вычисленный адрес действительно не задеплоен
        const isDeployed = await isContractDeployed(SEPOLIA_RPC_URL, result.data.address);
        expect(isDeployed).toBe(false);
    });
});
