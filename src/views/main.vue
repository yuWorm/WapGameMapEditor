<script setup lang="ts">
import { ref } from "vue";

import Layout from "./layout.vue";
import Chat from "./gpt.vue";
import Map from "./map.vue";
import JsonEditor from "@/views/JsonEditor.vue";
import { gameMap, loadMaps } from "@/libs/map";
import { FileExport } from "@vicons/fa";
import { DeleteSweepFilled } from "@vicons/material";
import { indexdb } from "@/libs/indexdb";

const chat = ref();
const jsonEditor = ref<InstanceType<typeof JsonEditor>>();
const deleteLoading = ref(false);

function setPromptData(data: Record<string, any>) {
  if (!chat.value) {
    return;
  }
  chat.value.initPromptData(data);
}

async function deleteAllMap() {
  deleteLoading.value = true;
  try {
    gameMap.load([{ name: "地图中心", area: "", x: 0, y: 0 }]);
  } catch (e) {
    console.error(e);
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <Layout logo-text="地图编辑器">
    <template #content>
      <Map @setAIMap="setPromptData" />
    </template>
    <template #side>
      <Chat ref="chat" />
    </template>
    <template #header-actions>
      <button
        @click="
          () => {
            jsonEditor?.openModal(JSON.stringify(gameMap.links.value, null, 4));
          }
        "
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
      >
        <n-icon><FileExport /></n-icon>
        <span class="ml-2">导出关系</span>
      </button>
      <button
        @click="
          () => {
            jsonEditor?.openModal(JSON.stringify(gameMap.maps.value, null, 4));
          }
        "
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
      >
        <n-icon><FileExport /></n-icon>
        <span class="ml-2">导出地图</span>
      </button>
      <n-spin :show="deleteLoading">
        <button
          @click="deleteAllMap"
          class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <n-icon><DeleteSweepFilled /></n-icon>
          <span class="ml-2">清空地图</span>
        </button>
      </n-spin>
    </template>
  </Layout>
  <JsonEditor ref="jsonEditor" />
</template>

<style scoped></style>
