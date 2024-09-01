<template>
  <div class="flex flex-col h-screen">
    <!-- Enhanced Header -->
    <header
      class="bg-blue-600 text-white p-4 shadow-lg flex justify-between items-center"
      style="height: 65px"
    >
      <slot name="logo">
        <h1 class="text-2xl font-bold">{{ props.logoText }}</h1>
      </slot>
      <div class="flex space-x-4">
        <slot name="header-actions"> </slot>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex-1 bg-gray-100 p-4 overflow-auto">
        <slot name="content"> </slot>
      </div>

      <div
        ref="sidebarRef"
        class="bg-white shadow-lg flex flex-col relative"
        :style="sidebarStyle"
      >
        <div
          class="w-1 h-full bg-gray-300 cursor-col-resize absolute left-0 top-0 hover:bg-blue-500 transition-colors"
          @mousedown="initResize"
        ></div>

        <button
          @click="toggleSidebar"
          class="absolute top-4 left-0 transform -translate-x-full bg-white p-2 rounded-l-md shadow-md"
        >
          <ChevronRightRound v-if="isSidebarOpen" class="w-6 h-6" />
          <ChevronLeftRound v-else class="w-6 h-6" />
        </button>

        <div class="flex-grow overflow-y-auto">
          <slot name="side"> </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, type PropType } from "vue";
import { ChevronRightRound, ChevronLeftRound } from "@vicons/material";

const props = defineProps({
  logoText: {
    type: String as PropType<string>,
    required: true,
  },
  sideWidth: {
    type: Number as PropType<number>,
    default: 500,
  },
  minSideWidth: {
    type: Number as PropType<number>,
    default: 400,
  },
  maxSideWidth: {
    type: Number as PropType<number>,
    default: 800,
  },
});

const sidebarRef = ref<HTMLElement | null>(null);
const isSidebarOpen = ref(true);
const sidebarWidth = ref(500);
const isResizing = ref(false);
const initialX = ref(0);
const initialWidth = ref(0);

const sidebarStyle = computed(() => ({
  width: `${sidebarWidth.value}px`,
  transform: `translateX(${isSidebarOpen.value ? "0" : "100%"})`,
  transition: isResizing.value
    ? "none"
    : "transform 0.2s ease-in-out, width 0.2s ease-in-out",
}));
let lastSideWidth = 0;
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  if (isSidebarOpen.value) {
    sidebarWidth.value = lastSideWidth;
  } else {
    lastSideWidth = sidebarWidth.value;
    sidebarWidth.value = 0;
  }
};

const initResize = (e: MouseEvent) => {
  isResizing.value = true;
  initialX.value = e.clientX;
  initialWidth.value = sidebarWidth.value;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResize);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const deltaX = initialX.value - e.clientX;
  const newWidth = initialWidth.value + deltaX;
  sidebarWidth.value = Math.max(
    props.minSideWidth,
    Math.min(props.maxSideWidth, newWidth),
  );
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
};

onMounted(() => {
  if (sidebarRef.value) {
    sidebarWidth.value = sidebarRef.value.offsetWidth;
  }

  if (props.sideWidth) {
    sidebarWidth.value = props.sideWidth;
  }
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
});
</script>

<style scoped>
.logo-text {
  background: linear-gradient(45deg, #f3ec78, #af4261);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
