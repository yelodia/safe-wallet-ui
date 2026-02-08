import { describe, it, expect } from 'vitest';
import { getAddress } from 'viem';
import { getPredictedSafeFromTransaction } from '@/utils/safe/getFromTransaction';
import {
    SEPOLIA_RPC_URL,
    MAINNET_RPC_URL,
    SEPOLIA_TX_HASH,
    INVALID_TX_HASH,
    fullSafeAccountConfig,
    fullSafeDeploymentConfig
} from './testData';

describe('getPredictedSafeFromTransaction', () => {
    it('should extract predictedSafe config from Sepolia transaction', async () => {
        const result = await getPredictedSafeFromTransaction(SEPOLIA_RPC_URL, SEPOLIA_TX_HASH);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        const { safeAccountConfig, safeDeploymentConfig } = result.data;

        // Сравниваем safeAccountConfig
        expect(safeAccountConfig.owners).toHaveLength(fullSafeAccountConfig.owners.length);
        // Сортируем owners для сравнения (порядок может отличаться)
        const sortedReceivedOwners = safeAccountConfig.owners
            .map(owner => getAddress(owner))
            .sort();
        const sortedExpectedOwners = fullSafeAccountConfig.owners
            .map(owner => getAddress(owner))
            .sort();
        expect(sortedReceivedOwners).toEqual(sortedExpectedOwners);
        expect(safeAccountConfig.threshold).toBe(fullSafeAccountConfig.threshold);
        expect(getAddress(safeAccountConfig.fallbackHandler)).toBe(
            getAddress(fullSafeAccountConfig.fallbackHandler)
        );
        expect(getAddress(safeAccountConfig.to)).toBe(getAddress(fullSafeAccountConfig.to));
        expect(safeAccountConfig.data).toBe(fullSafeAccountConfig.data);
        expect(getAddress(safeAccountConfig.paymentToken)).toBe(
            getAddress(fullSafeAccountConfig.paymentToken)
        );
        expect(safeAccountConfig.payment).toBe(fullSafeAccountConfig.payment);
        expect(getAddress(safeAccountConfig.paymentReceiver)).toBe(
            getAddress(fullSafeAccountConfig.paymentReceiver)
        );

        // Сравниваем safeDeploymentConfig
        expect(safeDeploymentConfig.saltNonce).toBe(fullSafeDeploymentConfig.saltNonce.toString());
        expect(safeDeploymentConfig.safeVersion).toBe(fullSafeDeploymentConfig.safeVersion);
        expect(safeDeploymentConfig.deploymentType).toBe(fullSafeDeploymentConfig.deploymentType);
    });

    it('should fail when transaction is on different network', async () => {
        const result = await getPredictedSafeFromTransaction(MAINNET_RPC_URL, SEPOLIA_TX_HASH);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should fail for transaction that is not Safe creation', async () => {
        const result = await getPredictedSafeFromTransaction(SEPOLIA_RPC_URL, INVALID_TX_HASH);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
