import { defineRule } from 'vee-validate';
import { isAddress, parseEther, parseAbiParameters } from 'viem';
import { getAbiMethods } from '@/utils/solidity/abiParser';
import { basicSolidityValidation } from '@/utils/validators/basicSolidityValidation';

/**
 * Регистрирует глобальные правила валидации для vee-validate
 */
export function setupValidationRules() {
  defineRule('isAddress', (value) => {
    if (!value || !value.trim()) {
      return true;
    }
    if (!isAddress(value.trim())) {
      return 'Invalid address format';
    }
    return true;
  });

  defineRule('uniqueInArray', (value, params, ctx) => {
    if (!value || !value.trim()) {
      return true;
    }
    
    if (!ctx || !ctx.name) {
      return true;
    }
    
    const fieldPath = ctx.name;
    const match = fieldPath.match(/^(\w+)\[(\d+)\]$/);
    if (!match) {
      return true;
    }
    
    const [, arrayName, currentIndex] = match;
    const currentIndexNum = parseInt(currentIndex, 10);
    const array = ctx.form[arrayName] || [];
    
    const normalizedValue = value.trim().toLowerCase();
    
    const duplicates = array.filter((item, index) => {
      if (index === currentIndexNum) return false;
      if (!item || !item.trim()) return false;
      return item.trim().toLowerCase() === normalizedValue;
    });
    
    if (duplicates.length > 0) {
      return 'Address already in use';
    }
    
    return true;
  });

  defineRule('isJson', (value) => {
    if (!value || !value.trim()) {
      return true;
    }
    try {
      JSON.parse(value.trim());
      return true;
    } catch {
      return 'Invalid JSON format';
    }
  });

  defineRule('hasAbiMethods', (value) => {
    if (!value || !value.trim()) {
      return true;
    }
    const { methods } = getAbiMethods(value.trim());
    if (methods.length === 0) {
      return 'No methods found in contract';
    }
    return true;
  });

  defineRule('isAmount', (value) => {
    if (!value || !value.trim()) {
      return true;
    }
    try {
      parseEther(value.trim());
      return true;
    } catch {
      return 'Invalid ETH value';
    }
  });

  defineRule('isBoolean', (value) => {
    if (!value || !value.trim()) {
      return true;
    }
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === 'false') {
      return true;
    }
    return 'invalid boolean value';
  });

  defineRule('isSolidityInpit', (value, params) => {
    if (!value || !value.trim()) {
      return true;
    }
    if (params.length === 0) {
      return true;
    }
    
    try {
      const parsed = parseAbiParameters(params.join(','));
      
      const input = parsed[0];
      const result = basicSolidityValidation(value.trim(), input);
      return result || true;
    } catch (error) {
      return `Validation error: ${error.message}`;
    }
  });
}
