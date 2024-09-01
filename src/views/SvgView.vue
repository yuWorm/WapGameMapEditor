<script setup lang="ts">
import { ref } from "vue";

const mapSvg = ref<SVGSVGElement>();
const emits = defineEmits(["backgrounClick"]);

let isDragging = false;
let dragStartX: number, dragStartY: number, startX: number, startY: number;

// 开始移动
function svgMouseDown(event: MouseEvent) {
  if (!mapSvg.value) return;
  if (event.button === 0) {
    // 左键
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    startX = mapSvg.value?.viewBox.baseVal.x;
    startY = mapSvg.value?.viewBox.baseVal.y;
  }
}

// 移动画布
function svgMouseMove(event: MouseEvent) {
  if (!mapSvg.value || !isDragging) return;

  const dx = dragStartX - event.clientX;
  const dy = dragStartY - event.clientY;
  mapSvg.value.viewBox.baseVal.x = startX + dx;
  mapSvg.value.viewBox.baseVal.y = startY + dy;
}

// 关闭移动
function svgMouseUp() {
  isDragging = false;
}

// 滚轮缩放
function svgMouseWheel(event: WheelEvent) {
  if (!mapSvg.value) return;
  event.preventDefault();
  const scaleAmount = 1.1;
  let viewBox = mapSvg.value.viewBox.baseVal;
  let scale = event.deltaY > 0 ? scaleAmount : 1 / scaleAmount;

  let newWidth = viewBox.width * scale;
  let newHeight = viewBox.height * scale;

  viewBox.x += (viewBox.width - newWidth) / 2;
  viewBox.y += (viewBox.height - newHeight) / 2;
  viewBox.width = newWidth;
  viewBox.height = newHeight;
}

// 设置svg画布的大小
function setSvgSize(w: number | undefined, h: number | undefined) {
  if (!mapSvg.value) {
    return;
  }
  mapSvg.value.setAttribute("viewBox", `0 0 ${w} ${h}`);
}

function backgroundClick() {
  emits("backgrounClick");
}

defineExpose({
  setSvgSize,
});
</script>

<template>
  <svg
    ref="mapSvg"
    id="map"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 600 400"
    @mousemove="svgMouseMove"
    @mouseup="svgMouseUp"
    @mousedown="svgMouseDown"
    @wheel="svgMouseWheel"
    @click="backgroundClick"
  >
    <slot></slot>
  </svg>
</template>

<style scoped></style>
