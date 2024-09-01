import { reactive, ref, watch } from "vue";
import { indexdb } from "@/libs/storage";

export interface MapLink {
  /**
   * p: 坐标
   * o: offest 坐标偏移
   * */
  name: string;
  p1: [number, number];
  o1: [number, number];
  p2: [number, number];
  o2: [number, number];
}

export interface BasicMapData {
  area?: string;
  name: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  x: number;
  y: number;
}

export interface AddMapDataBase {
  area?: string;
  name: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  x?: number;
  y?: number;
}

export interface MapData extends BasicMapData {
  [key: string]: string | number | undefined;
}

export interface AddMapData extends AddMapDataBase {
  [key: string]: string | number | undefined | null;
}

const oriNameMap: Record<string, string> = {
  top: "上方",
  bottom: "下方",
  left: "左方",
  right: "右方",
};

export class GameMap {
  public mapItemWH = reactive({
    w: 130,
    h: 60,
  });

  public mapItemGap = reactive({
    x: 190,
    y: 120,
  });

  public ortResveMap: Record<string, string> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };

  // 地图临接的地图的坐标差值
  public oriPositionDiffMap: Record<string, [number, number]> = {
    top: [0, -1],
    bottom: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };

  public ori = ["top", "bottom", "left", "right"];

  public links = ref<MapLink[]>([]);
  public maps = ref<MapData[]>([]);
  public mapNames: Record<string, MapData> = {};
  public linkNames: Set<string> = new Set();
  public positionsSet: Set<string> = new Set();

  constructor(maps: MapData[]) {
    this.links = ref<MapLink[]>([]);
    this.maps = ref<MapData[]>([]);
    this.load(maps);
  }

  public load(maps: MapData[]) {
    this.linkNames = new Set();
    this.positionsSet = new Set();
    this.mapNames = {};
    if (maps && maps.length > 0) {
      this.links.value = [];
      this.maps.value = maps;
      this.generateMapNames();
      this.generateLinks(maps);
    }
  }

  public addMap(map: AddMapData, generateLink: boolean = true) {
    if (map?.name in this.mapNames) {
      return `${map?.name}已存在`;
    }

    // 处理地图关系
    const rel = [map?.top, map?.bottom, map?.left, map?.right];

    const mapPosition = {
      x: 0,
      y: 0,
    };

    // 0, 1, 2, 3 对应 上下左右,所以关联的地图就是反过来的
    const oriInfo = ["bottom", "top", "right", "left"];
    // 0, 1, 2, 3 对应 上下左右, 然后根据上下左右的关系来设置新地图的坐标, 关联的地图就是反过来的
    const oriPositionOffest = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (let index = 0; index < rel.length; index++) {
      const name = rel[index];
      if (!name) {
        continue;
      }

      const linkMap = this.mapNames[name];
      if (!name) {
        continue;
      }

      if (!linkMap) {
        continue;
      }

      if (linkMap[oriInfo[index]] && linkMap[oriInfo[index]] !== map.name) {
        return `${map?.name}::${linkMap.name} ${oriNameMap[oriInfo[index]]}已存在地图, 为：${linkMap[oriInfo[index]]}，无法关联为：${map?.name}`;
      }

      linkMap[oriInfo[index]] = map.name;
      mapPosition.x = linkMap.x + oriPositionOffest[index][0];
      mapPosition.y = linkMap.y + oriPositionOffest[index][1];
    }

    // 如果要添加的地图没得xy的话，就为他添加xy
    if (map?.x === undefined || map?.y === undefined) {
      //如果没有关联地图的话直接返回异常
      if (mapPosition.y == 0 && mapPosition.x == 0) {
        console.error(mapPosition);
        return `${map?.name}::地图未设置坐标，且地图关联任何地图`;
      }
      map.x = mapPosition.x;
      map.y = mapPosition.y;
    } else {
      // 如果没有关联其他地图，直接设置使用设置的坐标就好
      if (mapPosition.y == 0 && mapPosition.x == 0) {
      }
      // 有坐标就得判断坐标是否跟生成的一样
      else if (map.x !== mapPosition.x || map.y !== mapPosition.y) {
        // 如果不一样，就删掉所有关联信息
        oriInfo.forEach((item) => {
          if (item in map) {
            delete map[item];
          }
        });
      }
    }

    if (this.positionsSet.has(`${map.x}-${map.y}`)) {
      return `${map?.name}::对应坐标地图已存在`;
    }
    // 消除类型检测
    if (map?.x && map?.y) {
      const newMap: MapData = { ...map, x: map.x, y: map.y };
      this.maps.value.push(newMap);
      this.mapNames[newMap.name] = newMap;
      this.positionsSet.add(`${map.x}-${map.y}`);
      if (generateLink) {
        this.generateLink(newMap);
      }
    }

    return true;
  }

  public removeMap(name: string) {
    const _map = this.mapNames[name];

    if (!_map) {
      return "地图不存在";
    }

    if (this.maps.value.length <= 1) {
      return "无法删除最后一个地图";
    }

    const map = { ..._map };

    delete this.mapNames[name];
    this.maps.value = this.maps.value.filter((item) => item.name !== name);
    if (this.positionsSet.has(`${map.x}-${map.y}`)) {
      this.positionsSet.delete(`${map.x}-${map.y}`);
    }
    // 删除连接
    this.ori.forEach((o) => {
      const linkName = map[o];
      if (!linkName) {
        return;
      }

      const n1 = `${map.name}-${linkName}`;
      if (this.linkNames.has(n1)) {
        this.linkNames.delete(n1);
        this.links.value = this.links.value.filter((item) => item.name !== n1);
      }
      const n2 = `${linkName}-${map.name}`;
      if (this.linkNames.has(n2)) {
        this.linkNames.delete(n2);
        this.links.value = this.links.value.filter((item) => item.name !== n2);
      }
    });
    return true;
  }

  public editMap(
    name: string,
    newName: string,
    x: number | undefined,
    y: number | undefined,
  ) {
    if (x === undefined || y === undefined) {
      return "坐标不可为空";
    }

    const map = this.mapNames[name];
    if (!map) {
      return "地图不存在";
    }

    if (name !== newName && newName in this.mapNames) {
      return "存在同名地图";
    }

    if (map.x != x || map.y != y) {
      if (this.positionsSet.has(`${x}-${y}`)) {
        return "对应地图已存在";
      } else {
        this.ori.forEach((o) => {
          if (!map[o]) {
            return;
          }
          this.removeLink(`${map.name}-${map[o]}`);
          this.removeLink(`${map[o]}-${map.name}`);
          delete map[o];
        });
      }
    }

    if (name != newName) {
      // 如果名称变了的话，就得删除更新所有的的连接关系
      this.ori.forEach((o) => {
        const linkName = map[o];
        if (!linkName) {
          return;
        }
        this.removeLink(`${name}-${linkName}`);
        this.removeLink(`${linkName}-${name}`);
        const linkMap = this.mapNames[linkName];
        if (!linkMap) {
          return;
        }
        map[o] = linkMap.name;
        linkMap[this.ortResveMap[o]] = newName;
      });
      map.name = newName;
      delete this.mapNames[name];
      this.mapNames[newName] = map;
    }

    map.x = x;
    map.y = y;
    // 重新建立连接
    this.generateLink(map);

    return true;
  }

  public removeLink(name: string) {
    if (!this.linkNames.has(name)) {
      return "连接不存在";
    }

    const nameSplit = name.split("-");
    if (nameSplit.length !== 2) {
      return "异常连接";
    }

    this.linkNames.delete(name);
    // 删除连接
    this.links.value = this.links.value.filter((link) => link.name !== name);

    const [mapName1, mapName2] = nameSplit;

    const map1 = this.mapNames[mapName1];
    const map2 = this.mapNames[mapName2];
    this.ori.forEach((item) => {
      if (map1[item] === map2.name) {
        delete map1[item];
        delete map2[this.ortResveMap[item]];
      }
    });

    return true;
  }

  public addLink(name: string, ori: string) {
    if (!(name in this.mapNames)) {
      return `地图[${name}]不存在`;
    }

    const map = this.mapNames[name];
    const linkMapPosition = {
      x: map.x + this.oriPositionDiffMap[ori][0],
      y: map.y + this.oriPositionDiffMap[ori][1],
    };

    // 判断地图是否存在
    if (!this.positionsSet.has(`${linkMapPosition.x}-${linkMapPosition.y}`)) {
      return `${oriNameMap[ori]}的地图不存在`;
    }

    const linkMap: MapData | undefined = this.maps.value.find(
      (item) => item.x === linkMapPosition.x && item.y === linkMapPosition.y,
    );
    if (!linkMap) {
      return `${oriNameMap[ori]}的地图不存在`;
    }

    map[ori] = linkMap.name;
    // 反转方向
    linkMap[this.ortResveMap[ori]] = map.name;
    // 生成链接关系
    this.generateLink(map);
    return true;
  }

  public generateLinks(maps: MapData[]) {
    maps.forEach((map: MapData) => {
      this.generateLink(map);
    });
  }

  public generateLink(map: MapData) {
    const dri = [map?.top, map?.bottom, map?.left, map?.right];
    dri.forEach((name: string | undefined, index) => {
      if (!name) {
        return;
      }

      const linkName = `${map.name}-${name}`;

      // 获取关联的地图项
      const linkMap = this.mapNames[name];

      if (!linkMap) {
        // 不存在关联地图，并且关联关系有了，直接删除对应的关系
        this.removeLink(`${name}-${index}`);
        return;
      }

      // 判断连接是否合理，合理则添加，不合理则删除对应的关联关系
      const pDiffSum =
        Math.abs(map.x - linkMap.x) + Math.abs(map.y - linkMap.y);
      // 不为1则不合理，因为只有4个方向，所以必须为1，为0则是连接本身，不为1则属于无法连接

      const deleteErrorRel = () => {
        const oriName = this.ori[index];
        delete map[oriName];
        const linkOriName: string = this.ortResveMap[oriName];
        delete linkMap[linkOriName];
        // 再删除关系
        this.removeLink(`${map.name}-${linkMap.name}`);
        this.removeLink(`${linkMap.name}-${map.name}`);
        return;
      };

      // 有连接关系了就返回
      if (
        this.linkNames.has(linkName) ||
        this.linkNames.has(`${name}-${map.name}`)
      ) {
        return;
      }

      let o1: [number, number];
      let p1: [number, number];
      let o2: [number, number];
      let p2: [number, number];

      if (pDiffSum !== 1) {
        // 不合理则删除对应的连接
        deleteErrorRel();
      }

      // 一次连接只有两种方向，x相等则为上下
      if (map.x == linkMap.x) {
        o1 = [this.mapItemWH.w / 2, this.mapItemWH.h];
        o2 = [this.mapItemWH.w / 2, 0];

        // AI生成的地图可能坐标不正确，所以得处理下，如果他不是上下，却进入了这里，就是异常的
        if (index != 0 && index != 1) {
          deleteErrorRel();
        }

        // 如果当前地图的y坐标大于关联地图的y坐标，则关联地图为上方
        if (map.y > linkMap.y) {
          p1 = [linkMap.x, linkMap.y];
          p2 = [map.x, map.y];
        } else {
          p1 = [map.x, map.y];
          p2 = [linkMap.x, linkMap.y];
        }
      } else {
        o1 = [this.mapItemWH.w, this.mapItemWH.h / 2];
        o2 = [0, this.mapItemWH.h / 2];

        // AI生成的地图可能坐标不正确，所以得处理下，如果他不是左右，却进入了这里，就是异常的
        if (index != 2 && index != 3) {
          deleteErrorRel();
        }

        // 如果当前地图的y坐标大于关联地图的y坐标，则关联地图未上方
        if (map.x > linkMap.x) {
          p1 = [linkMap.x, linkMap.y];
          p2 = [map.x, map.y];
        } else {
          p1 = [map.x, map.y];
          p2 = [linkMap.x, linkMap.y];
        }
      }

      this.links.value.push({
        name: linkName,
        p1: p1,
        o1: o1,
        p2: p2,
        o2: o2,
      });

      this.linkNames.add(linkName);
    });
  }

  public generateMapNames() {
    this.maps.value.forEach((map) => {
      this.mapNames[map.name] = map;
      this.positionsSet.add(`${map.x}-${map.y}`);
    });
  }

  public canAdd(x: number, y: number) {
    return !this.positionsSet.has(`${x}-${y}`);
  }
}

export const gameMap = new GameMap([]);

export function loadMaps() {
  indexdb
    .get("maps")
    .then((data) => {
      // console.error(data);
      let maps;
      if (data) {
        maps = JSON.parse(data);
      } else {
        maps = [{ name: "地图中心", x: 0, y: 0 }];
      }
      gameMap.load(maps);
      console.log("地图加载完毕");
    })
    .catch((e) => {
      console.error(e);
    });
}

function saveMaps() {
  indexdb.set("maps", JSON.stringify(gameMap.maps.value)).then((r) => {
    console.log("地图保存成功");
  });
}

watch(
  gameMap.maps,
  (n, b) => {
    if (n.length == 0) {
      return;
    }
    saveMaps();
  },
  { deep: true },
);

loadMaps();
