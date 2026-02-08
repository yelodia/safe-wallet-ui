import { describe, it, expect } from 'vitest';
import { getAddress } from 'viem';
import { predictSafeAddress } from '@/utils/safe/predictAddress';
import {
    SEPOLIA_RPC_URL,
    SEPOLIA_SAFE_ADDRESS,
    fullSafeAccountConfig,
    fullSafeDeploymentConfig,
    minimalSafeAccountConfig
} from './testData';

describe('predictSafeAddress', () => {
    it('should predict Safe address with full config on Sepolia', async () => {
        const result = await predictSafeAddress(SEPOLIA_RPC_URL, {
            safeAccountConfig: fullSafeAccountConfig,
            safeDeploymentConfig: fullSafeDeploymentConfig
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        // Нормализуем адреса перед сравнением
        expect(getAddress(result.data)).toBe(getAddress(SEPOLIA_SAFE_ADDRESS));
    });

    it('should predict Safe address with minimal config on Sepolia', async () => {
        const result = await predictSafeAddress(SEPOLIA_RPC_URL, {
            safeAccountConfig: minimalSafeAccountConfig
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        // Нормализуем адреса перед сравнением
        // Адрес вычисляется с учетом дефолтных значений из defaultConfig
        // Фактически вычисленный адрес: 0x6f3668BC237808Ae65FE46fd79D50E62Fca1283b
        expect(getAddress(result.data)).toBe(getAddress('0x6f3668BC237808Ae65FE46fd79D50E62Fca1283b'));
    });

    it('should fail when config missing required fields', async () => {
        const result = await predictSafeAddress(SEPOLIA_RPC_URL, {
            safeAccountConfig: {},
            safeDeploymentConfig: fullSafeDeploymentConfig
        });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
