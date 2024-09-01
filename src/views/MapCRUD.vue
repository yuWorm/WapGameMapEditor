<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NSelect,
} from "naive-ui";
import { useMessage } from "naive-ui";
import { type AddMapData, gameMap } from "@/libs/map";

interface CRUDState {
  title: string;
  type: "view" | "add" | "edit";
  name: string;
  ori: string | null;
}

class SubmitError extends Error {
  public message: string;
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

const message = useMessage();
const visible = ref(false);

const state = ref<CRUDState>({
  title: "查看地图",
  type: "view",
  name: "",
  ori: "",
});

const baseFormData: AddMapData = {
  name: "",
  area: "",
  top: "",
  bottom: "",
  left: "",
  right: "",
  x: undefined,
  y: undefined,
};

// 地图传来的方向是新地图的方向，关联就得是反的
const oriResverMap: Record<string, string> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const form = ref<AddMapData>({ ...baseFormData });

const rules = {
  name: {
    required: true,
    message: "请输入名称",
    trigger: ["blur", "input"],
  },
};

function open(s: CRUDState) {
  visible.value = true;
  state.value = s;
  if (s.type === "add") {
    Object.assign(form, baseFormData);
  } else if (s.type === "edit") {
    // TODO: Fetch existing data and populate form
  }
}

function openView(name: string) {
  open({
    title: name,
    name: name,
    type: "view",
    ori: "",
  });
  const map = gameMap.mapNames[name];
  form.value = { ...map };
}

function openAdd(name: string, ori: string | null) {
  open({
    title: "添加地图",
    name: name,
    type: "add",
    ori: ori,
  });
  if (state.value.ori) {
    form.value[oriResverMap[ori]] = state.value.name;
  }
}

function openEdit(name: string) {
  open({
    title: `编辑地图【${name}】`,
    name: name,
    type: "edit",
    ori: "",
  });

  const map = gameMap.mapNames[name];
  form.value = { ...map };
}

function handleSubmit() {
  // TODO: Implement form submission logic
  console.log("Form submitted:", form);
  try {
    if (state.value.type == "add") {
      const res = gameMap.addMap({ ...form.value });
      if (res !== true) {
        throw new SubmitError(res);
      }
      message.success("添加地图成功");
      handleCancel();
    } else {
      const res = gameMap.editMap(
        state.value.name,
        form.value.name,
        form.value.x,
        form.value.y,
      );
      if (res !== true) {
        throw new SubmitError(res);
      }
      message.success("编辑地图成功");
      handleCancel();
    }
  } catch (e: SubmitError) {
    message.error(e.message);
  }
}

function handleCancel() {
  form.value = { ...baseFormData };
  visible.value = false;
}

defineExpose({ openEdit, openView, openAdd });
</script>

<template>
  <n-modal
    v-model:show="visible"
    :title="state.title"
    preset="card"
    :style="{ width: '600px' }"
    :mask-closable="false"
    @close="handleCancel"
  >
    <n-alert title="注意" type="info" :bordered="false">
      <p v-if="state.type === 'add'">
        添加时，不填坐标，会根据你填的上下左右关系来生成。<br />
        如果填了坐标，则会按照坐标生成地图。<br />
      </p>
      <p v-else-if="state.type === 'edit'">
        只能编辑地图名称，和坐标，如果编辑了坐标会将地图的所有连接都删除。
        编辑连接请使用地图界面的【连】
      </p>
    </n-alert>
    <n-form
      :model="form"
      :rules="rules"
      class="mt-6"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="名称" path="name">
        <n-input
          v-model:value="form.name"
          placeholder="请输入名称"
          :disabled="state.type === 'view'"
        />
      </n-form-item>
      <n-form-item label="区域" path="area">
        <n-input v-model:value="form.area" placeholder="区域" disabled />
      </n-form-item>
      <n-form-item label="上" path="top">
        <n-select
          v-model:value="form.top"
          :options="gameMap.maps.value"
          label-field="name"
          value-field="name"
          clearable
          filterable
          placeholder="请选择上面的地图"
          :disabled="state.type === 'view' || state.type === 'edit'"
        />
      </n-form-item>
      <n-form-item label="下" path="bottom">
        <n-select
          v-model:value="form.bottom"
          :options="gameMap.maps.value"
          label-field="name"
          value-field="name"
          clearable
          filterable
          placeholder="请选择下面的地图"
          :disabled="state.type === 'view' || state.type === 'edit'"
        />
      </n-form-item>
      <n-form-item label="左" path="left">
        <n-select
          v-model:value="form.left"
          :options="gameMap.maps.value"
          label-field="name"
          value-field="name"
          clearable
          filterable
          placeholder="请选择左面的地图"
          :disabled="state.type === 'view' || state.type === 'edit'"
        />
      </n-form-item>
      <n-form-item label="右" path="right">
        <n-select
          v-model:value="form.right"
          :options="gameMap.maps.value"
          label-field="name"
          value-field="name"
          clearable
          filterable
          placeholder="请选择右面的地图"
          :disabled="state.type === 'view' || state.type === 'edit'"
        />
      </n-form-item>
      <n-form-item label="X 坐标" path="x">
        <n-input-number
          v-model:value="form.x"
          placeholder="请输入 X 坐标"
          :disabled="state.type === 'view'"
        />
      </n-form-item>
      <n-form-item label="Y 坐标" path="y">
        <n-input-number
          v-model:value="form.y"
          placeholder="请输入 Y 坐标"
          :disabled="state.type === 'view'"
        />
      </n-form-item>
    </n-form>

    <div class="flex justify-end gap-2 mt-10">
      <n-button
        v-if="state.type !== 'view'"
        type="primary"
        @click="handleSubmit"
        >保存</n-button
      >
    </div>
  </n-modal>
</template>

<style scoped>
/* 如果需要,可以在这里添加样式 */
</style>
