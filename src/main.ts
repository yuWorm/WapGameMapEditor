import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/tailwind.css";
import "@icon-park/vue-next/styles/index.css";
import "highlight.js/styles/dark.css";
import "markdown-it-copy-code/styles/base.css";
// choose one of the following styles
import "markdown-it-copy-code/styles/large.css";

const app = createApp(App);

app.use(router).mount("#app");
