import { describe, it, expect } from 'vitest';
import { getAddress } from 'viem';
import { initSafe } from '@/utils/safe/initSafe';
import {
    SEPOLIA_RPC_URL,
    MAINNET_RPC_URL,
    SEPOLIA_SAFE_ADDRESS,
    fullSafeAccountConfig,
    fullSafeDeploymentConfig,
    minimalSafeAccountConfig
} from './testData';

describe('initSafe', () => {
    it('should initialize existing Safe on Sepolia', async () => {
        const result = await initSafe(SEPOLIA_RPC_URL, SEPOLIA_SAFE_ADDRESS);
        expect(result.success).toBe(true);
        expect(result.safeSDK).toBeDefined();
    });

    it('should fail when Safe address exists on different network', async () => {
        const result = await initSafe(MAINNET_RPC_URL, SEPOLIA_SAFE_ADDRESS);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should fail when provider is null', async () => {
        const result = await initSafe(null, SEPOLIA_SAFE_ADDRESS);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should initialize new Safe with full config on Mainnet and return correct address', async () => {
        const result = await initSafe(MAINNET_RPC_URL, {
            safeAccountConfig: fullSafeAccountConfig,
            safeDeploymentConfig: fullSafeDeploymentConfig
        });
        expect(result.success).toBe(true);
        expect(result.safeSDK).toBeDefined();
        const address = await result.safeSDK.getAddress();
        // Нормализуем адреса перед сравнением
        expect(getAddress(address)).toBe(getAddress(SEPOLIA_SAFE_ADDRESS));
    });

    it('should fail when config missing required fields', async () => {
        const result = await initSafe(MAINNET_RPC_URL, {
            safeAccountConfig: {},
            safeDeploymentConfig: fullSafeDeploymentConfig
        });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should initialize new Safe with minimal config on Sepolia and return correct address', async () => {
        const result = await initSafe(SEPOLIA_RPC_URL, {
            safeAccountConfig: minimalSafeAccountConfig
        });
        expect(result.success).toBe(true);
        expect(result.safeSDK).toBeDefined();
        const address = await result.safeSDK.getAddress();
        // Нормализуем адреса перед сравнением
        // Адрес вычисляется с учетом дефолтных значений из defaultConfig
        // Фактически вычисленный адрес: 0x6f3668BC237808Ae65FE46fd79D50E62Fca1283b
        expect(getAddress(address)).toBe(getAddress('0x6f3668BC237808Ae65FE46fd79D50E62Fca1283b'));
    });
});
