<template>
  <n-button @click="openModal('{}')">打开</n-button>
  <teleport to="body">
    <div
      v-if="isModalOpen"
      class="modal"
      :class="{ 'light-theme': isLightTheme }"
      :style="modalStyle"
    >
      <div class="modal-content">
        <div
          class="modal-header"
          @mousedown="startDrag"
          @mouseup="stopDrag"
          @mousemove="drag"
        >
          <h2>JSON 编辑器</h2>
          <div class="header-controls">
            <n-switch v-model:value="isLightTheme" size="large">
              <template #checked-icon>
                <n-icon :component="WbSunnyRound" />
              </template>
              <template #unchecked-icon>
                <n-icon :component="Moon" />
              </template>
            </n-switch>
            <button class="close-button" @click="closeModal">
              <CloseRound />
            </button>
          </div>
        </div>
        <div ref="editorContainer" class="editor-container"></div>
        <div class="button-group">
          <button @click="downloadJSON">下载 JSON</button>
          <button @click="saveAndClose" class="primary-button">
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import * as monaco from "monaco-editor";
import { CloseRound, WbSunnyRound } from "@vicons/material";
import { Moon } from "@vicons/fa";

const props = defineProps({
  initialJson: {
    type: String,
    default: '{\n\t"key": "value"\n}',
  },
});

const emit = defineEmits(["update:json", "save"]);

const isModalOpen = ref(false);
const editorContainer = ref(null);
const isLightTheme = ref(false);
let editor = null;

const modalStyle = ref({
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
});

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const startDrag = (event) => {
  isDragging = true;
  dragStartX = event.clientX - parseFloat(modalStyle.value.left);
  dragStartY = event.clientY - parseFloat(modalStyle.value.top);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
};

const drag = (event) => {
  if (isDragging) {
    const newLeft = event.clientX - dragStartX;
    const newTop = event.clientY - dragStartY;
    modalStyle.value.left = `${newLeft}px`;
    modalStyle.value.top = `${newTop}px`;
    modalStyle.value.transform = "none";
  }
};

const stopDrag = () => {
  isDragging = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
};

const initEditor = (jsonContent) => {
  if (editor) {
    editor.setValue(jsonContent);
    return;
  }

  editor = monaco.editor.create(editorContainer.value, {
    value: jsonContent,
    language: "json",
    theme: isLightTheme.value ? "vs" : "vs-dark",
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: "on",
    renderLineHighlight: "all",
    contextmenu: true,
    scrollbar: {
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: "visible",
      horizontal: "visible",
    },
    padding: {
      top: 10,
      bottom: 10,
    },
  });

  editor.onDidChangeModelContent(() => {
    emit("update:json", editor.getValue());
  });
};

const openModal = (jsonContent = props.initialJson) => {
  isModalOpen.value = true;
  nextTick(() => {
    initEditor(jsonContent);
  });
};

const closeModal = () => {
  isModalOpen.value = false;
  modalStyle.value = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };
};

const downloadJSON = () => {
  const jsonContent = editor.getValue();
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  link.click();
  URL.revokeObjectURL(link.href);
};

const saveAndClose = () => {
  emit("save", editor.getValue());
  closeModal();
};

watch(isLightTheme, (newValue) => {
  if (editor) {
    monaco.editor.setTheme(newValue ? "vs" : "vs-dark");
  }
});

onMounted(() => {
  watch(
    () => props.initialJson,
    (newValue) => {
      if (editor && !isModalOpen.value) {
        editor.setValue(newValue);
      }
    },
  );
});

onUnmounted(() => {
  if (editor) {
    editor.dispose();
  }
});

defineExpose({
  openModal,
  closeModal,
});
</script>

<style scoped>
.modal {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  user-select: none;
}

.modal-content {
  background-color: #1e1e1e;
  border-radius: 6px;
  width: 80vw;
  max-width: 1200px;
  height: 75vh;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  cursor: move;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  color: #cccccc;
  font-size: 16px;
  font-weight: normal;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.editor-container {
  height: calc(75vh - 50px);
}

.button-group {
  padding: 10px 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #252526;
  border-top: 1px solid #3c3c3c;
}

button {
  padding: 6px 12px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #4a4a4a;
}

.primary-button {
  background-color: #0e639c;
}

.primary-button:hover {
  background-color: #1177bb;
}

.light-theme .modal-content {
  background-color: #ffffff;
}

.light-theme .modal-header {
  background-color: #f3f3f3;
  border-bottom: 1px solid #e0e0e0;
}

.light-theme h2 {
  color: #333333;
}

.light-theme .close-button {
  color: #333333;
}

.light-theme .close-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.light-theme .button-group {
  background-color: #f3f3f3;
  border-top: 1px solid #e0e0e0;
}

.light-theme button {
  background-color: #e0e0e0;
  color: #333333;
}

.light-theme button:hover {
  background-color: #d0d0d0;
}

.light-theme .primary-button {
  background-color: #007acc;
  color: #ffffff;
}

.light-theme .primary-button:hover {
  background-color: #0062a3;
}

/* Switch styles */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
