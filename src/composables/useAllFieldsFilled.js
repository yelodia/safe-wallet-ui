import { computed } from 'vue';

/**
 * Composable для проверки, что все указанные поля формы заполнены
 * 
 * @param {...(import('vue').Ref | import('vue').ComputedRef)} fieldRefs - ref'ы из defineField или массивы из useFieldArray
 * @returns {import('vue').ComputedRef<boolean>} - computed, возвращающий true если все поля заполнены
 * 
 * @example
 * // Одиночное поле из defineField
 * const [threshold, thresholdAttrs] = defineField('threshold');
 * 
 * // Массив строк из useFieldArray (initialValues: { owners: [''] })
 * const { fields: owners } = useFieldArray('owners');
 * 
 * // Использование
 * const allFieldsFilled = useAllFieldsFilled(owners, threshold);
 */
export function useAllFieldsFilled(...fieldRefs) {
    return computed(() => {
        if (!fieldRefs || fieldRefs.length === 0) {
            return false;
        }
        return fieldRefs.every(fieldRef => {
            if (!fieldRef) {
                return false;
            }

            const value = fieldRef.value;

            if (Array.isArray(value)) {
                return value.every(fieldRefOrValue => {
                    if (fieldRefOrValue === null || fieldRefOrValue === undefined) {
                        return false;
                    }

                    let fieldValue;
                    if (typeof fieldRefOrValue === 'object' && 'value' in fieldRefOrValue) {
                        const inner = fieldRefOrValue.value;
                        fieldValue =
                            inner && typeof inner === 'object' && 'value' in inner
                                ? inner.value
                                : inner;
                    } else {
                        fieldValue = fieldRefOrValue;
                    }

                    return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== '';
                });
            }
            return value !== null && value !== undefined && String(value).trim() !== '';
        });
    });
}