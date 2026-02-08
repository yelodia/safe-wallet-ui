/**
 * Утилиты для работы с Pinata API
 */

import { PinataSDK } from 'pinata';

const validKeysCache = new Map();

const gatewayDomainCache = new Map();

const fileContentCache = new Map();

/**
 * Валидирует Pinata API ключ (JWT токен)
 * @param {string} jwt - JWT токен Pinata API
 * @returns {Promise<{valid: boolean, error?: string, isNetworkError?: boolean}>} Результат валидации
 */
export async function validatePinataApiKey(jwt) {
    if (!jwt || jwt.trim() === '') {
        return { valid: true };
    }

    if (validKeysCache.has(jwt)) {
        return { valid: true };
    }

    try {
        const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'authorization': `Bearer ${jwt}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.message === 'Congratulations! You are communicating with the Pinata API!') {
                validKeysCache.set(jwt, true);
                return { valid: true };
            }
        }

        return { valid: false, error: 'Invalid API key', isNetworkError: false };
    } catch (error) {
        return { valid: false, error: error.message || 'Network error', isNetworkError: true };
    }
}

/**
 * Загружает приватный файл с JSON содержимым
 * @param {string} jwt - токен авторизации
 * @param {object} content - объект для записи в JSON
 * @param {string} name - имя файла
 * @param {object} metadata - объект keyvalues
 * @returns {Promise<object>} Объект UploadResponse с полями: id, name, cid, size, created_at, keyvalues и т.д.
 */
export async function uploadPrivateFile(jwt, content, name, metadata) {
    try {
        const pinata = new PinataSDK({ pinataJwt: jwt });
        const upload = await pinata.upload.private
            .json({ content })
            .name(name)
            .keyvalues(metadata);

        if (upload.cid) {
            fileContentCache.set(upload.cid, content);
        }
        
        return upload;
    } catch (error) {
        console.error('Error uploading private file:', error);
        throw error;
    }
}

/**
 * Получает список приватных файлов с автопагинацией и фильтрацией
 * @param {string} jwt - токен авторизации
 * @param {string} [name] - фильтр по имени (частичное совпадение - contains). Пустая строка обрабатывается как отсутствие фильтра
 * @param {object} [keyvalues] - фильтр по keyvalues (точное совпадение). Формат: { state: "pending", safe: "0x..." }
 * @returns {Promise<Array>} Массив файлов (полный список после автопагинации)
 */
export async function listPrivateFiles(jwt, name, keyvalues) {
    try {
        const pinata = new PinataSDK({ pinataJwt: jwt });
        let query = pinata.files.private
            .list()
            .limit(50)
            .order('ASC');

        if (name && name.trim() !== '') {
            query = query.name(String(name).trim());
        }

        if (keyvalues && Object.keys(keyvalues).length > 0) {
            const stringKeyvalues = {};
            for (const [key, value] of Object.entries(keyvalues)) {
                stringKeyvalues[key] = String(value);
            }
            query = query.keyvalues(stringKeyvalues);
        }

        const files = [];
        for await (const item of query) {
            files.push(item);
        }

        return files;
    } catch (error) {
        console.error('Error getting private files list:', error);
        throw error;
    }
}

/**
 * Удаляет файлы по массиву ID
 * @param {string} jwt - токен авторизации
 * @param {string[]} ids - массив ID файлов
 * @returns {Promise<Array>} Массив объектов { id: string, status: string }
 */
export async function deletePrivateFile(jwt, ids) {
    try {
        const pinata = new PinataSDK({ pinataJwt: jwt });
        const deletedFiles = await pinata.files.private.delete(ids);
        return deletedFiles;
    } catch (error) {
        console.error('Error deleting private files:', error);
        throw error;
    }
}

/**
 * Обновляет метаданные файла (keyvalues)
 * @param {string} jwt - токен авторизации
 * @param {string} id - ID файла
 * @param {object} metadata - объект keyvalues для добавления (старые не удаляются)
 * @returns {Promise<object>} Объект FileListItem с обновленными данными
 */
export async function updatePrivateFile(jwt, id, metadata) {
    try {
        const pinata = new PinataSDK({ pinataJwt: jwt });
        const update = await pinata.files.private.update({
            id,
            keyvalues: metadata
        });
        return update;
    } catch (error) {
        console.error('Error updating private file:', error);
        throw error;
    }
}

/**
 * Получает gateway домен для указанного JWT токена
 * Использует кеш для избежания повторных запросов
 * @param {string} jwt - токен авторизации
 * @returns {Promise<string>} Gateway домен в формате "domain.mypinata.cloud"
 */
export async function getGatewayDomain(jwt) {
    if (gatewayDomainCache.has(jwt)) {
        return gatewayDomainCache.get(jwt);
    }

    try {
        const response = await fetch('https://api.pinata.cloud/v3/ipfs/gateways', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get gateways: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data.rows || data.data.rows.length === 0) {
            throw new Error('No gateways found');
        }

        const firstGateway = data.data.rows[0];
        const domain = firstGateway.domain;
        
        const fullDomain = `${domain}.mypinata.cloud`;
        
        gatewayDomainCache.set(jwt, fullDomain);
        
        return fullDomain;
    } catch (error) {
        console.error('Error getting gateway domain:', error);
        throw error;
    }
}

/**
 * Получает содержимое приватного файла по CID
 * Использует gateway домен и SDK метод для получения файла
 * Кеширует результат по CID для избежания повторных запросов
 * @param {string} jwt - токен авторизации
 * @param {string} cid - CID файла
 * @returns {Promise<object>} Содержимое файла (JSON объект)
 */
export async function getPrivateFileContent(jwt, cid) {
    try {
        if (fileContentCache.has(cid)) {
            return fileContentCache.get(cid);
        }

        const gatewayDomain = await getGatewayDomain(jwt);
        
        const pinata = new PinataSDK({ 
            pinataJwt: jwt,
            pinataGateway: gatewayDomain
        });
        
        const { data } = await pinata.gateways.private.get(cid);
        
        fileContentCache.set(cid, data);
        
        return data;
    } catch (error) {
        console.error('Error getting private file content:', error);
        throw error;
    }
}
