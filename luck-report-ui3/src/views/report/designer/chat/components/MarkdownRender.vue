<template>
  <div class="markdown-render" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

/**
 * MarkdownRender 组件
 * 负责将 Markdown 文本渲染为 HTML，支持代码高亮和 XSS 防护
 * 使用 marked + highlight.js 实现代码高亮，DOMPurify 防止 XSS 攻击
 */

interface Props {
  content: string
}

const props = defineProps<Props>()

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  })
)

marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  // 软换行归一化已转移到 InputArea.handlePaste（粘贴阶段处理）。
  // 这里只做轻量规范化：折叠多个连续空行，避免 marked 把多 \n\n 渲染成空 <p>。
  const normalized = props.content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
  const rawHtml = marked.parse(normalized) as string
  const safeHtml = DOMPurify.sanitize(rawHtml)
  // marked 解析后总会输出 "</p>\n"，v-html 注入后这个 \n 在父元素
  // white-space: normal 下被合并（不再渲染成空白行），但为安全起见仍剥一次。
  return safeHtml.replace(/\n+$/, '')
})
</script>

<style>
@import 'highlight.js/styles/github.css';

.markdown-render {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  word-wrap: break-word;
  word-break: normal;
  white-space: normal;
}

.markdown-render p {
  margin: 0 0 8px;
}

.markdown-render p:last-child {
  margin-bottom: 0;
}

.markdown-render pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-render code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
}

.markdown-render :not(pre) > code {
  background-color: #eff1f3;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-render blockquote {
  border-left: 4px solid #d1d5db;
  padding-left: 12px;
  margin: 8px 0;
  color: #6b7280;
}

.markdown-render ul,
.markdown-render ol {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-render table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-render th,
.markdown-render td {
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  text-align: left;
}

.markdown-render th {
  background-color: #f9fafb;
}

.markdown-render a {
  color: #2563eb;
  text-decoration: none;
}

.markdown-render a:hover {
  text-decoration: underline;
}

.markdown-render img {
  max-width: 100%;
  border-radius: 4px;
}

.markdown-render hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 12px 0;
}

.markdown-render h1,
.markdown-render h2,
.markdown-render h3,
.markdown-render h4,
.markdown-render h5,
.markdown-render h6 {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-render h1 { font-size: 1.4em; }
.markdown-render h2 { font-size: 1.25em; }
.markdown-render h3 { font-size: 1.1em; }
</style>
