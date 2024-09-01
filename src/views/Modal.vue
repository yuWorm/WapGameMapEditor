<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">{{ title }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>
      <div class="mb-4">
        <slot></slot>
      </div>
      <div class="flex justify-end">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps<{
  visible: boolean;
  title: string;
}>();

const emit = defineEmits(["update:visible"]);

const close = () => {
  emit("update:visible", false);
};
</script>
