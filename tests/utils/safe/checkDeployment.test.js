import { describe, it, expect } from 'vitest';
import { isContractDeployed } from '@/utils/safe/checkDeployment';
import { SEPOLIA_RPC_URL, MAINNET_RPC_URL, SEPOLIA_SAFE_ADDRESS } from './testData';

describe('isContractDeployed', () => {
    it('should return true for deployed contract on Sepolia', async () => {
        const result = await isContractDeployed(SEPOLIA_RPC_URL, SEPOLIA_SAFE_ADDRESS);
        expect(result).toBe(true);
    });

    it('should return false for contract not deployed on Mainnet', async () => {
        if (!MAINNET_RPC_URL) {
            throw new Error('MAINNET_RPC_URL is not defined');
        }
        const result = await isContractDeployed(MAINNET_RPC_URL, SEPOLIA_SAFE_ADDRESS);
        expect(result).toBe(false);
    });
});
