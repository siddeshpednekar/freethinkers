<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <LoaderPage v-if="isLoading" />
      <LoginPage v-else />
    </q-page-container>
  </q-layout>
</template>

<script>
import LoaderPage from '../components/LoaderPage.vue';
import LoginPage from '../pages/LoginPage.vue';

export default {
  components: {
    LoaderPage,
    LoginPage
  },
  data() {
    return {
      isLoading: true
    };
  },
  mounted() {
    setTimeout(() => {
      this.isLoading = false;
    }, 1000); // Simulate loading time
  }
}
</script>
