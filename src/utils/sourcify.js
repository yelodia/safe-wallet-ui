/**
 * Утилиты для работы с Sourcify API
 * Sourcify - сервис для верификации контрактов и получения ABI
 */

const SOURCIFY_BASE_URL = 'https://sourcify.dev/server/files';
const METADATA_FILE = 'metadata.json';

/**
 * Получает ABI контракта через Sourcify API
 * @param {string} address - Адрес контракта (checksum format)
 * @param {string|number} chainId - ID сети (например, 1 для Ethereum Mainnet)
 * @param {AbortSignal} [signal] - Сигнал для отмены запроса
 * @returns {Promise<string>} JSON-строка с ABI или пустая строка, если не найдено
 */
export async function getAbiFromSourcify(address, chainId, signal) {
    if (!address || !chainId) {
        return '';
    }

    const url = `${SOURCIFY_BASE_URL}/${chainId}/${address}`;

    try {
        const response = await fetch(url, {
            signal,
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok || response.status === 404) {
            return '';
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const metadata = data.find((item) => item.name === METADATA_FILE);

        if (!metadata || !metadata.content) {
            return '';
        }

        const metadataContent = JSON.parse(metadata.content);
        const abi = metadataContent?.output?.abi;

        if (!abi || !Array.isArray(abi)) {
            return '';
        }

        return JSON.stringify(abi);
    } catch (error) {
        console.error('Error fetching ABI from Sourcify:', error);
        return '';
    }
}
