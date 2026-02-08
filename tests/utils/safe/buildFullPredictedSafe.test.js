import { describe, it, expect } from 'vitest';
import { getAddress } from 'viem';
import { buildFullPredictedSafe } from '@/utils/safe/buildFullPredictedSafe';
import { predictSafeAddress } from '@/utils/safe/predictAddress';
import {
    SEPOLIA_RPC_URL,
    SEPOLIA_SAFE_ADDRESS,
    fullSafeAccountConfig,
    fullSafeDeploymentConfig,
    minimalSafeAccountConfig
} from './testData';

describe('buildFullPredictedSafe', () => {
    it('should build full predictedSafe config from minimal config on Sepolia', async () => {
        const saltNonce = 0;
        
        const result = await buildFullPredictedSafe(
            SEPOLIA_RPC_URL,
            minimalSafeAccountConfig,
            saltNonce
        );

        // Проверяем успешность выполнения
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        const { safeAccountConfig, safeDeploymentConfig } = result.data;

        // Проверяем safeDeploymentConfig
        expect(safeDeploymentConfig).toEqual(fullSafeDeploymentConfig);

        // Проверяем safeAccountConfig (с нормализацией адресов)
        expect(safeAccountConfig.threshold).toBe(fullSafeAccountConfig.threshold);
        expect(safeAccountConfig.paymentToken).toBe(fullSafeAccountConfig.paymentToken);
        expect(safeAccountConfig.payment).toBe(fullSafeAccountConfig.payment);
        
        // Проверяем адреса с нормализацией
        expect(getAddress(safeAccountConfig.fallbackHandler)).toBe(
            getAddress(fullSafeAccountConfig.fallbackHandler)
        );
        expect(getAddress(safeAccountConfig.to)).toBe(
            getAddress(fullSafeAccountConfig.to)
        );
        expect(getAddress(safeAccountConfig.paymentReceiver)).toBe(
            getAddress(fullSafeAccountConfig.paymentReceiver)
        );

        // Проверяем data
        expect(safeAccountConfig.data.toLowerCase()).toBe(
            fullSafeAccountConfig.data.toLowerCase()
        );

        // Проверяем owners (должны быть отсортированы)
        expect(safeAccountConfig.owners.length).toBe(fullSafeAccountConfig.owners.length);
        
        // Сортируем owners из fullSafeAccountConfig для сравнения
        const sortedFullOwners = [...fullSafeAccountConfig.owners]
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        
        safeAccountConfig.owners.forEach((owner, index) => {
            expect(getAddress(owner)).toBe(
                getAddress(sortedFullOwners[index])
            );
        });

        // Вычисляем адрес через predictSafeAddress с полученным predictedSafe
        const addressResult = await predictSafeAddress(SEPOLIA_RPC_URL, result.data);
        expect(addressResult.success).toBe(true);
        expect(addressResult.data).toBeDefined();
        
        // Проверяем, что вычисленный адрес равен ожидаемому (с нормализацией)
        expect(getAddress(addressResult.data)).toBe(getAddress(SEPOLIA_SAFE_ADDRESS));
    });
});
