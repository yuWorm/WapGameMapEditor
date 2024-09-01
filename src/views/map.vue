<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, h } from "vue";
import { NIcon, useMessage, useDialog } from "naive-ui";
import {
  EditNoteFilled,
  DeleteFilled,
  RemoveRedEyeFilled,
  AddSharp,
} from "@vicons/material";
import { Robot } from "@vicons/fa";
import { gameMap } from "@/libs/map";
import SvgView from "@/views/SvgView.vue";
import MapCRUD from "@/views/MapCRUD.vue";

const emits = defineEmits(["setAIMap"]);

const mapCrud = ref<InstanceType<typeof MapCRUD>>();
const mapSvg = ref<InstanceType<typeof SvgView>>();
const mapContainer = ref<HTMLElement>();
const addButtonGroup = ref<SVGGElement>();

const message = useMessage();
const dialog = useDialog();

// 中心点坐标，根据屏幕宽高生成的
const centerPosition = reactive({
  x: 400,
  y: 200,
});

// 地图块间隙
const gapInfo = reactive({
  x: 150,
  y: 120,
});

// 预先创建的添加按钮
const addButtons = reactive<Record<string, SVGGElement | null>>({
  top: null,
  bottom: null,
  left: null,
  right: null,
});

const linkButtons = reactive<Record<string, SVGGElement | null>>({});

// 当前选中的房间
const selectedRoom = ref<string | null>(null);

// 菜单项目
const menus = [
  {
    label: "查看",
    key: "view",
    icon() {
      return h(NIcon, null, {
        default: () => h(RemoveRedEyeFilled),
      });
    },
  },
  {
    label: "编辑",
    key: "edit",
    icon() {
      return h(NIcon, null, {
        default: () => h(EditNoteFilled),
      });
    },
  },
  {
    label: "删除",
    key: "delete",
    icon() {
      return h(NIcon, null, {
        default: () => h(DeleteFilled),
      });
    },
  },
  {
    label: "AI续写",
    key: "aiAdd",
    icon() {
      return h(NIcon, null, {
        default: () => h(Robot),
      });
    },
  },
];
const menuPosition = reactive({
  x: 0,
  y: 0,
});
const menuShow = ref(false);
// 点击菜单项回调
function menuClick(key: string | number) {
  if (selectedRoom.value === null) {
    return;
  }
  switch (key) {
    case "view":
      mapCrud.value?.openView(selectedRoom.value);
      break;
    case "edit":
      mapCrud.value?.openEdit(selectedRoom.value);
      break;
    case "delete":
      const res = gameMap.removeMap(selectedRoom.value);
      res !== true
        ? message.error(res)
        : (function () {
            message.success("删除地图成功");
            menuShow.value = false;
          })();
      break;
    case "aiAdd":
      if (!selectedRoom.value) {
        return;
      }
      emits("setAIMap", { name: selectedRoom.value });
      menuClickOutside();
      break;
    default:
      break;
  }
}
function menuClickOutside() {
  menuShow.value = false;
}
// 触发菜单显示
function handleContextMenu(e: MouseEvent, name: string) {
  e.preventDefault();
  menuShow.value = false;
  selectedRoom.value = name;
  nextTick().then(() => {
    menuShow.value = true;
    menuPosition.x = e.clientX;
    menuPosition.y = e.clientY;
  });
}

// 设置地图渲染的初始位置
function setCenterPosition() {
  centerPosition.x = window.innerWidth / 2 - 300;
  centerPosition.y = window.innerHeight / 2 - 300;
}

// 创建添加按钮
function createAddButton(direction: string, isLink: boolean = false) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.classList.add("add-button");
  g.classList.add("cursor-pointer");
  g.setAttribute("data-direction", direction);

  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("r", "15");

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  if (isLink) {
    text.textContent = "连";
    text.setAttribute("font-size", "16");
    circle.setAttribute("fill", "#14C9C9"); // 设置填充颜色为绿色
  } else {
    text.textContent = "+";
    text.setAttribute("font-size", "20");
    circle.setAttribute("fill", "#4CAF50"); // 设置填充颜色为绿色
  }
  text.setAttribute("fill", "white"); // 设置文字颜色为白色
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("font-family", "Arial, sans-serif");

  g.appendChild(circle);
  g.appendChild(text);

  g.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!selectedRoom.value) return;
    if (isLink) {
      const res = gameMap.addLink(selectedRoom.value, direction);
      res !== true
        ? message.error(res)
        : (function () {
            message.success("添加连接成功");
            toggleAddButtons(false, 0, 0, "");
          })();
    } else {
      mapCrud.value?.openAdd(selectedRoom.value, direction);
    }
    // 隐藏索引按钮
    hideAllButtons();
  });

  // 默认隐藏按钮
  g.style.display = "none";

  return g;
}

// 初始化添加按钮
function initAddButtons() {
  ["top", "bottom", "left", "right"].forEach((direction) => {
    const addButton = createAddButton(direction);
    const linkButton = createAddButton(direction, true);
    // 初始化添加按钮
    if (addButton) {
      addButtons[direction] = addButton;
      addButtonGroup.value?.appendChild(addButton);
    }
    // 初始化连接按钮
    if (linkButton) {
      linkButtons[direction] = linkButton;
      addButtonGroup.value?.appendChild(linkButton);
    }
  });
}

// 更新添加按钮位置
function updateAddButtonsPosition(x: number, y: number) {
  const offsets = {
    top: [gameMap.mapItemWH.w / 2, -30],
    bottom: [gameMap.mapItemWH.w / 2, gameMap.mapItemWH.h + 30],
    left: [-30, gameMap.mapItemWH.h / 2],
    right: [gameMap.mapItemWH.w + 30, gameMap.mapItemWH.h / 2],
  };

  Object.entries(offsets).forEach(([direction, [offsetX, offsetY]]) => {
    const addButton = addButtons[direction];
    // 更新添加按钮位置
    if (addButton) {
      addButton.setAttribute(
        "transform",
        `translate(${x + offsetX}, ${y + offsetY})`,
      );
    }
    // 更新连接按钮位置
    const linkButton = linkButtons[direction];
    if (linkButton) {
      linkButton.setAttribute(
        "transform",
        `translate(${x + offsetX}, ${y + offsetY})`,
      );
    }
  });
}

function hideAllButtons() {
  Object.values(addButtons).forEach((button) => {
    if (button) button.style.display = "none";
  });
  Object.values(linkButtons).forEach((button) => {
    if (button) button.style.display = "none";
  });
}

// 显示或隐藏添加按钮
function toggleAddButtons(show: boolean, x: number, y: number, map: any) {
  hideAllButtons();
  if (show) {
    updateAddButtonsPosition(x, y);
    const mapPositionOffest = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    const directions = ["top", "bottom", "left", "right"];

    directions.forEach((direction, i) => {
      const canAdd = gameMap.canAdd(
        map.x + mapPositionOffest[i][0],
        map.y + mapPositionOffest[i][1],
      );

      if (canAdd) {
        const button = addButtons[direction];
        if (button) button.style.display = "block";
      } else {
        if (!selectedRoom.value) return;
        const map = gameMap.mapNames[selectedRoom.value];
        if (!map[direction]) {
          const button = linkButtons[direction];
          if (button) button.style.display = "block";
        }
      }
    });
  }
}

// 地图项目点击事件
function mapItemClick(x: number, y: number, name: string) {
  const map = gameMap.mapNames[name];
  if (selectedRoom.value === name) {
    selectedRoom.value = null;
    toggleAddButtons(false, x, y, map);
  } else {
    selectedRoom.value = name;
    toggleAddButtons(true, x, y, map);
  }
}

// 背景点击事件，用于取消选中
function backgroundClick() {
  if (selectedRoom.value) {
    selectedRoom.value = null;
    toggleAddButtons(false, 0, 0, null);
  }
}

function linkClick(name: string) {
  dialog.info({
    title: "删除连接",
    content: `是否删除[${name}]之间的连接`,
    negativeText: "取消",
    positiveText: "确认",
    onPositiveClick(e) {
      const res = gameMap.removeLink(name);
      if (res !== true) {
        message.error(res);
      } else {
        message.success("已删除连接关系");
      }
    },
  });
}

onMounted(() => {
  window.addEventListener("resize", () => {
    mapSvg.value?.setSvgSize(
      mapContainer.value?.clientWidth,
      mapContainer.value?.clientHeight,
    );
    setCenterPosition();
  });
  mapSvg.value?.setSvgSize(
    mapContainer.value?.clientWidth,
    mapContainer.value?.clientHeight,
  );
  setCenterPosition();
  initAddButtons();
});
</script>

<template>
  <div ref="mapContainer" id="map-container">
    <SvgView ref="mapSvg" @backgroun-click="backgroundClick">
      <!-- 房间 -->
      <g id="rooms">
        <g
          v-for="(map, index) in gameMap.maps.value"
          :key="map.name"
          class="room cursor-pointer"
          :data-room-id="index"
          :class="{ selected: selectedRoom === map.name }"
          @click.stop="
            mapItemClick(
              centerPosition.x + map.x * gameMap.mapItemGap.x,
              centerPosition.y + map.y * gameMap.mapItemGap.y,
              map.name,
            )
          "
        >
          <rect
            :x="centerPosition.x + map.x * gameMap.mapItemGap.x"
            :y="centerPosition.y + map.y * gameMap.mapItemGap.y"
            :width="gameMap.mapItemWH.w"
            :height="gameMap.mapItemWH.h"
            rx="10"
            ry="10"
            @contextmenu="
              (e) => {
                handleContextMenu(e, map.name);
              }
            "
            :fill="selectedRoom === map.name ? '#3a7cbd' : '#4a90e2'"
          />
          <text
            :x="
              centerPosition.x +
              gameMap.mapItemWH.w / 2 +
              Number(map.x) * gameMap.mapItemGap.x
            "
            :y="
              centerPosition.y +
              (gameMap.mapItemWH.h / 2 + 5) +
              Number(map.y) * gameMap.mapItemGap.y
            "
            font-family="Arial"
            font-size="14"
            fill="white"
            text-anchor="middle"
            class="pointer-events-none"
          >
            {{ map.name }}({{ map?.x }}, {{ map?.y }})
          </text>
        </g>
      </g>

      <!-- 连接线 -->
      <g id="connections">
        <g
          v-for="(link, index) in gameMap.links.value"
          :key="link.name"
          class="connection"
          :data-connection-id="index"
        >
          <line
            class="cursor-pointer"
            @click="linkClick(link.name)"
            :x1="
              centerPosition.x + link.p1[0] * gameMap.mapItemGap.x + link.o1[0]
            "
            :y1="
              centerPosition.y + link.p1[1] * gameMap.mapItemGap.y + link.o1[1]
            "
            :x2="
              centerPosition.x + link.p2[0] * gameMap.mapItemGap.x + link.o2[0]
            "
            :y2="
              centerPosition.y + link.p2[1] * gameMap.mapItemGap.y + link.o2[1]
            "
            stroke="#666"
            stroke-width="2"
          />
        </g>
      </g>

      <!-- 添加按钮 -->
      <g ref="addButtonGroup" id="add-buttons"></g>
    </SvgView>
    <button
      class="floating-button"
      @click="
        () => {
          mapCrud?.openAdd('', null);
        }
      "
    >
      <NIcon><AddSharp /></NIcon>
    </button>
  </div>
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="menuPosition.x"
    :y="menuPosition.y"
    :options="menus"
    :show="menuShow"
    :on-clickoutside="menuClickOutside"
    @select="menuClick"
  />
  <MapCRUD ref="mapCrud" />
</template>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.room:hover rect {
  fill: #3a7cbd;
}

.connection:hover line {
  stroke: #ff4500;
  stroke-width: 3;
}

.add-button {
  cursor: pointer;
}

.add-button circle {
  fill: #4caf50;
}

.add-button text {
  fill: white;
  font-family: Arial, sans-serif;
  font-size: 20px;
  text-anchor: middle;
  dominant-baseline: central;
}

.selected rect {
  stroke: #ff4500;
  stroke-width: 2;
}

.floating-button {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition:
    background-color 0.3s,
    transform 0.3s;
}

.floating-button:hover {
  background-color: #2980b9;
  transform: scale(1.1);
}
</style>
