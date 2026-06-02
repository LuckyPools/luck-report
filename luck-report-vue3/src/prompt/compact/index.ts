/**
 * 压缩对话提示词加载器
 * 加载 src/prompt/compact 目录下的 .md 文件，组装压缩对话所需的系统提示词
 * 供 compactConversation API 调用时使用，将提示词通过接口发送给后端
 *
 * 使用 Vite 的 ?raw 后缀将 .md 文件作为原始字符串导入
 */
import compactPrompt from './compact.md?raw'

/**
 * 获取压缩对话的系统提示词
 * 供 API 层调用，将提示词通过请求体传给后端
 *
 * @returns 压缩对话的完整系统提示词
 */
export function getCompactSystemPrompt(): string {
  return compactPrompt
}
