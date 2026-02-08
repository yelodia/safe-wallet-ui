<script setup>
import { ref } from 'vue';
import Step1Form from './Step1Form.vue';
import Step2Review from './Step2Review.vue';

const formData = ref({
    owners: [''],
    threshold: 1
});

const activeStep = ref(1);

const handleNext = () => {
    activeStep.value = 2;
};

const handleBack = () => {
    activeStep.value = 1;
};
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <h1>Create Account</h1>

        <Stepper v-model:value="activeStep">
            <StepList>
                <Step :value="1">Configure</Step>
                <Step :value="2">Review</Step>
            </StepList>
            <StepPanels>
                <StepPanel :value="1" class="rounded-xl">
                    <Step1Form v-model="formData" @next="handleNext" />
                </StepPanel>
                <StepPanel :value="2" class="rounded-xl">
                    <Step2Review 
                        :form-data="formData" 
                        :is-active="activeStep === 2"
                        @back="handleBack" 
                    />
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>
</template>

<style scoped>

:deep(.p-step) {
    pointer-events: none;
    cursor: default;
}
</style>
