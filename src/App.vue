<script setup lang="ts"></script>

<template>
  <Suspense>
    <n-dialog-provider>
      <n-message-provider>
        <RouterView />
      </n-message-provider>
    </n-dialog-provider>
  </Suspense>
</template>

<style>
body {
  margin: 0;
  min-width: 100vw;
  min-height: 100vh;
}

#app {
  min-width: 100vw;
  min-height: 100vh;
}
</style>
