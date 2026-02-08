<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppFooter from './AppFooter.vue';
import AppTopbar from './AppTopbar.vue';
const { layoutState, hideMobileMenu } = useLayout();
const route = useRoute();
const showSidebar = computed(() => !route.meta.hideSidebar);

watch(
    () => route.path,
    () => {
        hideMobileMenu();
    }
);

</script>

<template>
    <div class="layout-wrapper" :class="{'layout-mobile-active': layoutState.mobileMenuActive, 'layout-static': showSidebar}">
        <AppTopbar />
        <div class="layout-sidebar" id="layout-sidebar" v-if="showSidebar">
            <router-view name="sidebar" />
        </div>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view />
            </div>
            <AppFooter />
        </div>
        <div class="layout-mask animate-fadein" @click="hideMobileMenu" />
    </div>
    <Toast position="bottom-right" />
    <ConfirmDialog />
</template>
