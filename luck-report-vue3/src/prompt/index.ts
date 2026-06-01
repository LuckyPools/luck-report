/**
 * 提示词加载器
 * 加载 src/prompt 目录下的 .md 文件，组装为完整系统提示词
 * 支持变量插值，供 ContextManager 消费
 *
 * 使用 Vite 的 ?raw 后缀将 .md 文件作为原始字符串导入，
 * 无需额外 loader 配置，构建时直接内联为字符串常量
 */
import systemPrompt from './system.md?raw'
import toolsGuide from './tools-guide.md?raw'
import rules from './rules.md?raw'

/** 提示词段名称到内容的映射 */
const promptSections: Record<string, string> = {
  system: systemPrompt,
  'tools-guide': toolsGuide,
  rules
}

/** 默认组装顺序：角色定义 → 工具指南 → 操作规则 */
const DEFAULT_SECTION_ORDER = ['system', 'tools-guide', 'rules']

/**
 * 组装完整系统提示词
 * 按默认顺序拼接所有提示词段，并替换动态变量占位符
 *
 * @param variables - 变量映射表，如 { tool_descriptions: '...' }
 * @returns 完整的系统提示词
 */
export function buildPrompt(variables: Record<string, string> = {}): string {
  const combined = DEFAULT_SECTION_ORDER
    .map(name => promptSections[name])
    .filter(Boolean)
    .join('\n\n')

  return interpolate(combined, variables)
}

/**
 * 获取单段提示词
 * 供需要单独传递某段提示词的场景使用
 *
 * @param name - 提示词段名称，如 'system'、'tools-guide'、'rules'
 * @returns 提示词内容，未找到返回 null
 */
export function getPromptSection(name: string): string | null {
  return promptSections[name] ?? null
}

/**
 * 变量插值
 * 将模板中的 {{key}} 占位符替换为实际值
 * 未提供值的占位符保持原样，避免误替换
 *
 * @param template - 包含占位符的模板字符串
 * @param variables - 变量映射表
 * @returns 替换后的字符串
 */
function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in variables ? variables[key]! : match
  })
}
