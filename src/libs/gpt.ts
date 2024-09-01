import type { ChatMessage } from "@/types";
import { storage } from "@/libs/storage";
import OpenAI from "openai";
import cryptoJS from "crypto-js";
import { gameMap } from "@/libs/map";

export interface GPTSettings {
  apiKey: string | undefined;
  baseUrl: string;
  model: OpenAI.ChatModel;
}

export interface GPTModelOptionsType {
  label: OpenAI.ChatModel;
  value: OpenAI.ChatModel;
}

const gptModels: GPTModelOptionsType[] = [
  { label: "gpt-4o", value: "gpt-4o" },
  { label: "gpt-4o-2024-05-13", value: "gpt-4o-2024-05-13" },
  { label: "gpt-4o-2024-08-06", value: "gpt-4o-2024-08-06" },
  { label: "gpt-4o-mini", value: "gpt-4o-mini" },
  { label: "gpt-4o-mini-2024-07-18", value: "gpt-4o-mini-2024-07-18" },
  { label: "gpt-4-turbo", value: "gpt-4-turbo" },
  { label: "gpt-4-turbo-2024-04-09", value: "gpt-4-turbo-2024-04-09" },
  { label: "gpt-4-0125-preview", value: "gpt-4-0125-preview" },
  { label: "gpt-4-turbo-preview", value: "gpt-4-turbo-preview" },
  { label: "gpt-4-1106-preview", value: "gpt-4-1106-preview" },
  { label: "gpt-4-vision-preview", value: "gpt-4-vision-preview" },
  { label: "gpt-4", value: "gpt-4" },
  { label: "gpt-4-0314", value: "gpt-4-0314" },
  { label: "gpt-4-0613", value: "gpt-4-0613" },
  { label: "gpt-4-32k", value: "gpt-4-32k" },
  { label: "gpt-4-32k-0314", value: "gpt-4-32k-0314" },
  { label: "gpt-4-32k-0613", value: "gpt-4-32k-0613" },
  { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
  { label: "gpt-3.5-turbo-16k", value: "gpt-3.5-turbo-16k" },
  { label: "gpt-3.5-turbo-0301", value: "gpt-3.5-turbo-0301" },
  { label: "gpt-3.5-turbo-0613", value: "gpt-3.5-turbo-0613" },
  { label: "gpt-3.5-turbo-1106", value: "gpt-3.5-turbo-1106" },
  { label: "gpt-3.5-turbo-0125", value: "gpt-3.5-turbo-0125" },
  { label: "gpt-3.5-turbo-16k-0613", value: "gpt-3.5-turbo-16k-0613" },
];

class ChatGPTClient {
  protected client: OpenAI | undefined;
  public settings: GPTSettings = {
    apiKey: undefined,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
  };
  private secretKey = "doihB@()XBh2q-Y*@H0p1yh4";
  constructor() {
    this.refreshSettings();
    this.client = this.refreshClient();
    // window.client = this.client;
  }

  public refreshClient(): OpenAI | undefined {
    if (!this.getApiKey()) {
      return;
    }

    const client = new OpenAI({
      baseURL: this.settings.baseUrl,
      apiKey: this.settings.apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.client = client;
    return client;
  }

  public refreshSettings() {
    const settings: GPTSettings = storage.get("gpt_settings");
    if (settings) {
      if (settings.apiKey) {
        settings.apiKey = cryptoJS.AES.decrypt(
          settings.apiKey,
          this.secretKey,
        ).toString(cryptoJS.enc.Utf8);
      }
      this.settings = settings;
      this.refreshClient();
    }
  }

  public async send(messages: ChatMessage[], callback: (msg: string) => void) {
    if (!this.client) {
      this.refreshClient();
    }

    if (!this.client) {
      callback("初始化GPTSDK失败");
      return;
    }

    const chatStearm = await this.client.chat.completions.create({
      model: this.settings.model,
      messages: messages,
      stream: true,
    });
    for await (const chunk of chatStearm) {
      const msg = chunk.choices[0]?.delta?.content || "";
      callback(msg);
    }
  }

  public getModels(): GPTModelOptionsType[] {
    return gptModels;
  }

  public setModel(model: OpenAI.ChatModel) {
    this.saveSettings(this.settings.apiKey, this.settings.baseUrl, model);
  }

  public getApiKey(): string | undefined {
    return this.settings?.apiKey;
  }

  public getBaseUrl(): string {
    return this.settings.baseUrl;
  }

  public getModel(): OpenAI.ChatModel {
    return this.settings.model;
  }

  saveSettings(
    apiKey: string | undefined,
    baseUrl: string = "https://api.openai.com/v1",
    model: OpenAI.ChatModel = "gpt-3.5-turbo",
  ): boolean {
    if (!apiKey) {
      return false;
    }

    if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
      alert("API Key 错误，请检查后重新输入！");
      return false;
    }

    if (!(baseUrl.startsWith("http") || baseUrl.startsWith("https"))) {
      alert("baseUrl 错误，请参考默认baseUrl！");
      return false;
    }

    if (!baseUrl.endsWith("v1")) {
      alert("baseUrl 错误，请参考默认baseUrl！");
      return false;
    }

    const aesAPIKey = cryptoJS.AES.encrypt(apiKey, this.secretKey).toString();

    storage.set("gpt_settings", {
      apiKey: aesAPIKey,
      baseUrl: baseUrl,
      model: model,
    } as GPTSettings);
    this.refreshSettings();
    return true;
  }
}

export const client = new ChatGPTClient();

const basePrompt = `
你是一个mud游戏资深设计设计师，现在你在设计mud的地图。地图有上下左右四个方位，并且有区域和坐标。
地图的坐标计算为在左则x -1，在右则x + 1，在上则y - 1，在下则y + 1。
你返回的结果请使用json格式，并且结构如下：{name:'', 'top': '', 'bottom': '', 'left': '', right: '', x: 0, y: 0}, 
name：是地图名称，top是地图上方关联的地图，bottom是地图下方关联的地图，left是地图左方关联的地图，right是地图右方关联的地图，x是地图x轴坐标，y是地图y轴坐标。
地图坐标请根据实际情况生成,请保证生成的每个地图都相互关联，并且不可出现越坐标关联，比如某地图坐标是（1，1），所以他上方的地图坐标就是（1，0），不能是（1，2）之类的其他所有值。
关联的所有地图都必须给出，请使用json数组返回。
上下左右的连接为选填项目，但是如果上下左右都没有连接地图，x，y坐标则必填。
`;

export const mapGeneratePrompt = {
  withPosition: (x: number, y: number) => {
    return `${basePrompt}
    下面请根据我给出的坐标数据和我的要求描述生成数据,坐标数据数据为：x: ${x}, y: ${y}。
    要求我将随后发给你。
    `;
  },
  withOneMap: (name: string) => {
    const map = gameMap.mapNames[name];
    return `${basePrompt}
    下面请根据我给出的地图数据和我的要求描述生成数据,地图数据为：${JSON.stringify(map)}。
    要求我将随后发给你。
    `;
  },
  withAllMap: () => {
    const maps = gameMap.maps.value;
    return `${basePrompt}
    下面请根据我给出的地图数据和我的要求描述生成数据，现在的地图数据为多个，如下：${JSON.stringify(maps)}。
    请根据我现有的地图，按照我的要求拓展地图，拓展的地图坐标是基于已有的开始的，不能和给你的地图信息重复。
    并且，我输入的地图信息不需要再返回给我，要求我稍后发给你。
    `;
  },
};
