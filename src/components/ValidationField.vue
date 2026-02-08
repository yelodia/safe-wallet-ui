<script setup>
import { computed, toRef, ref, watch } from 'vue'
import { useField } from 'vee-validate'
import { useLayout } from '@/layout/composables/layout'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  validation: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
    default: 'Value',
  },
  type: {
    type: String,
    required: false,
    default: 'text', // text | textarea | select
  },
  options: {
    type: Array,
    required: false,
    default: () => [],
  },
  optionLabel: {
    type: String,
    required: false,
    default: 'label',
  },
  optionValue: {
    type: [String, null],
    required: false,
    default: null,
  },
})

const { isDarkTheme } = useLayout();

const validationRules = computed(() => props.validation || undefined)

const { value, errorMessage } = useField(
  toRef(props, 'name'),
  validationRules,
  {
    validateOnValueUpdate: true,
    validateOnMount: false,
  },
)

const inputValue = ref(value.value);

const componentTag = computed(() => {
  if (props.type === 'textarea') return Textarea
  if (props.type === 'select') return Select
  return InputText
})

const componentProps = computed(() => {
  if (props.type === 'select') {
    const base = {
      options: props.options,
      optionLabel: props.optionLabel,
      onChange: handleChange,
    }
    if (props.optionValue) {
      base.optionValue = props.optionValue
    }
    return base
  }

  return {
    onBlur: handleBlur,
    onChange: handleChange,
    onKeyup: handleKeyup,
    onInput: handleInput,
  }
})

const emit = defineEmits(['input', 'blur', 'keyup', 'change'])

const handleInput = (e) => {
  emit('input', e)
}

const handleBlur = (e) => {
  emit('blur', e)
}

const handleKeyup = (e) => {
  emit('keyup', e)
}

const handleChange = (e) => {
  value.value = inputValue.value;
  emit('change', e)
}

watch(() => value.value, () => {
  inputValue.value = value.value;
});

</script>

<template>
  <div class="mt-8">
    <FloatLabel>
      <component
        :is="componentTag"
        v-model="inputValue"
        v-bind="componentProps"
        :variant="isDarkTheme ? 'outlined' : 'filled'"
        :class="[{ 'p-invalid': errorMessage }, 'w-full']"
      />
      <label >{{ label }}</label>
    </FloatLabel>

    <small v-if="errorMessage" class="block text-red-500 mt-1">
      <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
    </small>
  </div>
</template>

<style scoped>
textarea {
  min-height: 200px;
}
</style>

