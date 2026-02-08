/**
 * Pinia plugin для автоматической синхронизации состояния stores с localStorage
 * 
 * Использование:
 * ```js
 * import { createPinia } from 'pinia'
 * import { persistPlugin } from '@/stores/plugins/persist'
 * 
 * const pinia = createPinia()
 * pinia.use(persistPlugin)
 * ```
 */

import { accountsSchema } from '@/stores/schemas/accounts';

/**
 * Валидирует структуру данных аккаунтов с использованием Zod схемы
 * @param {any} data - Данные для валидации
 * @returns {boolean} true если данные валидны
 */
function isValidAccountsData(data) {
    const result = accountsSchema.safeParse(data);
    return result.success;
}

/**
 * Создает Pinia plugin для персистентности в localStorage
 * @param {Object} options - Опции плагина
 * @param {string} options.namespace - Префикс для ключей localStorage (по умолчанию 'safe-ui')
 * @returns {Function} Pinia plugin
 */
export function persistPlugin({ namespace = 'safe-ui' } = {}) {
    return ({ store, options }) => {
        const persistConfig = options.$persist || null;
        
        if (!persistConfig) {
            return
        }

        const { key, paths, flat } = persistConfig
        const storageKey = `${namespace}:${key}`

        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const parsed = JSON.parse(saved)
                
                if (paths && Array.isArray(paths)) {
                    paths.forEach(path => {
                        if (flat && paths.length === 1) {
                            if (key === 'accounts' && !isValidAccountsData(parsed)) {
                                console.warn(`[Pinia Persist] Invalid accounts data format, clearing ${storageKey}`)
                                localStorage.removeItem(storageKey)
                                return
                            }
                            store.$state[path] = parsed
                        } else if (parsed[path] !== undefined) {
                            store.$state[path] = parsed[path]
                        }
                    })
                } else {
                    Object.assign(store.$state, parsed)
                }
            }
        } catch (error) {
            console.warn(`[Pinia Persist] Failed to load state for ${key}:`, error)
            if (key === 'accounts') {
                localStorage.removeItem(storageKey)
            }
        }

        store.$subscribe((mutation, state) => {
            try {
                let dataToSave = state

                if (paths && Array.isArray(paths)) {
                    if (flat && paths.length === 1) {
                        dataToSave = state[paths[0]]
                    } else {
                        dataToSave = {}
                        paths.forEach(path => {
                            if (state[path] !== undefined) {
                                dataToSave[path] = state[path]
                            }
                        })
                    }
                }

                localStorage.setItem(storageKey, JSON.stringify(dataToSave))
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.warn(`[Pinia Persist] Storage quota exceeded for ${key}`)
                } else {
                    console.warn(`[Pinia Persist] Failed to save state for ${key}:`, error)
                }
            }
        })
    }
}
