<template>
  <div class="loader-container">
    <img src="/img/logo.png" alt="Loading..." class="loader-logo"><h4>logo</h4>
    <q-spinner color="primary" size="50px" />
  </div>
</template>

<script>
export default {
  name: 'LoaderPage'
}
</script>

<style scoped>
.loader-container {
  display: flex;
  font-family: "Poppins", sans-serif;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #fff;
}

.loader-logo {
  width: 100px;
  margin-bottom: 20px;
}
h4 {
  font-size: 1.1rem;
  margin-top: -9px;
  letter-spacing: -0.5px;
  color: #151111;
}
</style>
