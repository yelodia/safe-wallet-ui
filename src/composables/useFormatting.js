/**
 * Composable для форматирования различных данных
 * Независим от сторов, может использоваться в любых компонентах
 */

/**
 * Форматирует адрес, показывая первые и последние символы
 * @param {string} address - Адрес для форматирования
 * @param {number} startLength - Количество символов в начале (по умолчанию 6)
 * @param {number} endLength - Количество символов в конце (по умолчанию 4)
 * @returns {string} Отформатированный адрес
 */
export function formatAddress(address, startLength = 6, endLength = 4) {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
