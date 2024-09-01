// src/libs/indexdb.ts

import { IndexedDBManager } from "@/libs/storage";

const indexdb = new IndexedDBManager("WMapGPT", "prompts");

export { indexdb };
