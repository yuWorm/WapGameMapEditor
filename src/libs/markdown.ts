import Markdown from "markdown-it";
import highlight from "highlight.js";
import MarkdownItCopyCode from "markdown-it-copy-code";

const mdOptions: Markdown.Options = {
  linkify: true,
  typographer: true,
  breaks: true,
  langPrefix: "language-",
  // 代码高亮
  highlight(str, lang) {
    if (lang && highlight.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          highlight.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return "";
  },
};

const copyOptions = {
  btnText: "复制",
  failText: "复制失败",
  successText: "复制成功",
};

export const md = new Markdown(mdOptions).use(MarkdownItCopyCode);
