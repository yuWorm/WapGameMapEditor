<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      class="px-3 py-2 cursor-pointer hover:bg-white rounded-md"
    >
      选择提示词
    </button>
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10"
    >
      <ul class="py-1">
        <li
          v-for="prompt in prompts"
          :key="prompt.key"
          @click="selectPrompt(prompt)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {{ prompt.value.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { indexdb } from "@/libs/indexdb";

const isOpen = ref(false);
const prompts = ref<
  Array<{ key: string; value: { name: string; content: string } }>
>([]);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectPrompt = (prompt: {
  key: string;
  value: { name: string; content: string };
}) => {
  emit("select-prompt", prompt.value.content);
  isOpen.value = false;
};

const loadPrompts = async () => {
  const keys = ((await indexdb.get("promptKeys")) as string[]) || [];
  prompts.value = await Promise.all(
    keys.map(async (key) => ({
      key,
      value: await indexdb.get(key),
    })),
  );
};

onMounted(() => {
  loadPrompts();
});

const emit = defineEmits(["select-prompt"]);
</script>
