<template>
  <div class="flex flex-col h-full w-full bg-gray-50">
    <!-- Chat messages section -->
    <div class="mx-2 mt-2 flex-1 mb-2 overflow-y-scroll" ref="chatListDom">
      <div
        class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg mb-2"
        v-for="item of messageList.filter((v) => v.role !== 'system')"
      >
        <div class="flex justify-between items-center mb-2">
          <div class="font-bold">{{ roleAlias[item.role] }}：</div>
          <Copy class="invisible group-hover:visible" :content="item.content" />
        </div>
        <div>
          <template v-if="item.content">
            <div
              class="prose text-sm text-slate-600 leading-relaxed"
              v-html="md.render(item.content)"
            ></div>
            <div class="flex justify-end">
              <button
                v-if="
                  item.role === 'assistant' &&
                  extractAndValidateJSON(item.content).isValid &&
                  !isTalking
                "
                class="btn-mini bg-blue-500 hover:bg-blue-600"
                @click="
                  () => {
                    jsonEditor?.openModal(
                      extractAndValidateJSON(item.content).extractedJSON,
                    );
                  }
                "
              >
                添加到地图
              </button>
            </div>
          </template>
          <Loading v-else />
        </div>
      </div>
    </div>

    <!-- Input section -->
    <div class="sticky bottom-0 w-full p-4 bg-white shadow-lg">
      <div class="flex flex-wrap items-center mb-3 space-x-2">
        <div class="flex space-x-2">
          <button
            class="btn-mini bg-blue-500 hover:bg-blue-600"
            @click="openPromptModal"
          >
            模式({{ generateMode }}{{ getGenerateModeShow() }})
          </button>
          <button
            class="btn-mini bg-green-500 hover:bg-green-600"
            @click="openModelModal"
          >
            模型({{ settings.model }})
          </button>
          <button
            class="btn-mini bg-purple-500 hover:bg-purple-600"
            @click="openSettingsModal"
          >
            设置
          </button>

          <button
            class="btn-mini bg-purple-500 hover:bg-purple-600"
            @click="clearMessage"
          >
            清空记录
          </button>
        </div>
      </div>
      <div class="flex">
        <input
          class="input flex-grow"
          placeholder="请输入"
          v-model="messageContent"
          @keydown.enter="isTalking || sendChatMessage()"
        />
        <button
          class="btn ml-2"
          :disabled="isTalking"
          @click="sendChatMessage()"
        >
          发送
        </button>
      </div>
    </div>

    <!-- Modals -->
    <Modal v-model:visible="isPromptModalVisible" title="更换生成模式">
      <n-tabs v-model:value="generateMode" type="line" animated>
        <n-tab-pane name="基于单图续写" tab="基于单图续写">
          <n-select
            v-model:value="promptData.name"
            :options="gameMap.maps.value"
            filterable
            placeholder="请选择地图"
            label-field="name"
            value-field="name"
          ></n-select>
        </n-tab-pane>
        <n-tab-pane name="基于全图续写" tab="基于全图续写"> </n-tab-pane>
        <n-tab-pane name="基于坐标续写" tab="基于坐标续写">
          <n-form :model="promptData" inline>
            <n-form-item label="x">
              <n-input-number
                placeholder="请输入x坐标"
                v-model:value="promptData.x"
              />
            </n-form-item>
            <n-form-item label="y">
              <n-input-number
                placeholder="请输入y坐标"
                v-model:value="promptData.y"
              />
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </Modal>

    <Modal v-model:visible="isModelModalVisible" title="切换模型">
      <n-select v-model:value="settings.model" :options="client.getModels()" />
      <template #footer>
        <button @click="saveModel" class="btn">保存</button>
      </template>
    </Modal>

    <Modal v-model:visible="isSettingsModalVisible" title="设置">
      <div class="mb-4">
        <label class="block mb-2">API Key:</label>
        <input
          v-model="settings.apiKey"
          type="password"
          class="w-full p-2 border rounded"
        />
      </div>
      <div class="mb-4">
        <label class="block mb-2">Base URL:</label>
        <input
          v-model="settings.baseUrl"
          type="text"
          class="w-full p-2 border rounded"
        />
      </div>
      <template #footer>
        <button @click="saveSettings" class="btn">保存</button>
      </template>
    </Modal>
  </div>

  <JsonEditor ref="jsonEditor" :add-map="true" />
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from "vue";
import { client, type GPTSettings, mapGeneratePrompt } from "@/libs/gpt";
import Loading from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import Modal from "./Modal.vue";
import { NSelect, useMessage } from "naive-ui";
import { md } from "@/libs/markdown";
import type { ChatMessage } from "@/types";
import { extractAndValidateJSON } from "@/libs/utils";
import { useCopyCode } from "markdown-it-copy-code";
import JsonEditor from "./JsonEditor.vue";
import { gameMap } from "@/libs/map";

interface PromptData {
  name?: string;
  x?: number;
  y?: number;
}

const isTalking = ref(false);
const messageContent = ref("");
const jsonEditor = ref<InstanceType<typeof JsonEditor>>();
const settings = reactive<GPTSettings>({
  apiKey: client.getApiKey(),
  baseUrl: client.getBaseUrl(),
  model: client.getModel(),
});
const chatListDom = ref<HTMLDivElement>();
const roleAlias = { user: "ME", assistant: "WMapGPT", system: "System" };
const message = useMessage();
const baseMessage = [
  {
    role: "system",
    content: "你是 ChatGPT，OpenAI 训练的大型语言模型，尽可能简洁地回答。",
  },
  {
    role: "assistant",
    content: `你好，我是一个地图生成工具。以为为你生成游戏地图，请在下面输入需求，我将为你生成游戏地图。`,
  },
];
const messageList = ref<ChatMessage[]>([...baseMessage]);

let promptData: Record<string, any> = reactive({
  name: undefined,
  x: 0,
  y: 0,
});
const generateMode = ref<string>("基于全图续写");

const isPromptModalVisible = ref(false);
const isModelModalVisible = ref(false);
const isSettingsModalVisible = ref(false);

const openPromptModal = () => {
  isPromptModalVisible.value = true;
};

const openModelModal = () => {
  isModelModalVisible.value = true;
};

const openSettingsModal = () => {
  isSettingsModalVisible.value = true;
};

const updatePrompts = () => {
  // This function can be used to refresh the PromptSelector if needed
};

const saveModel = () => {
  client.setModel(settings.model);
  isModelModalVisible.value = false;
};

const saveSettings = () => {
  if (client.saveSettings(settings.apiKey.trim(), settings.baseUrl.trim())) {
    isSettingsModalVisible.value = false;
  }
};

const sendChatMessage = async () => {
  if (isTalking.value || !messageContent.value.length) return;

  try {
    isTalking.value = true;
    if (messageList.value.length === 2) {
      messageList.value.pop();
    }
    const prompt = messageList.value[0];
    if (prompt.role === "system") {
      const [isOk, promptContent] = getPrompt();
      if (!isOk) {
        return message.error(promptContent);
      }
      prompt.content = promptContent;
    }
    messageList.value.push({ role: "user", content: messageContent.value });
    messageContent.value = "";
    messageList.value.push({ role: "assistant", content: "" });

    await client.send(messageList.value, (msg: string) => {
      messageList.value[messageList.value.length - 1].content += msg;
    });
  } catch (error: any) {
    messageList.value[messageList.value.length - 1].content += error.toString();
  } finally {
    isTalking.value = false;
  }
};

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  chatListDom.value.scrollTop = chatListDom.value.scrollHeight;
};

function clearMessage() {
  messageList.value = [...baseMessage];
}

function initPromptData(data: Record<string, any>) {
  promptData = data;
  generateMode.value = "基于单图续写";
}

function getGenerateModeShow() {
  if (generateMode.value == "基于单图续写") {
    return `[${promptData?.name}]`;
  } else if (generateMode.value == "基于坐标续写") {
    return `[${promptData?.x},${promptData?.y}]`;
  } else {
    return "";
  }
}

function getPrompt(): [boolean, string] {
  if (generateMode.value === "基于单图续写") {
    if (!promptData?.name) {
      return [false, "请先设置/选择地图"];
    }
    return [true, mapGeneratePrompt.withOneMap(promptData.name)];
  } else if (generateMode.value === "基于坐标续写") {
    if (!promptData?.x && !promptData?.y) {
      return [false, "请先设置基础坐标"];
    }
    return [true, mapGeneratePrompt.withPosition(promptData.x, promptData.y)];
  } else {
    return [true, mapGeneratePrompt.withAllMap()];
  }
}

watch(messageList.value, () => nextTick(() => scrollToBottom()));

onMounted(() => {
  useCopyCode();

  if (!client.getApiKey()) {
    openSettingsModal();
  }
});

defineExpose({ initPromptData });
</script>

<style scoped>
.input {
  @apply flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200;
}

.btn:disabled {
  @apply bg-gray-400 cursor-not-allowed;
}

.btn-mini {
  @apply px-1.5 py-0.5 text-xs font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200;
}
</style>
