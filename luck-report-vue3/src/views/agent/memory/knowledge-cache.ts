/**
 * 会话级知识文档缓存，解决同一文档不重复加载和压缩后不丢失文档内容的矛盾
 */

/**
 * 知识文档缓存条目
 */
export interface KnowledgeEntry {
  /** 文档名（如 PARENT_CELL_RELATION） */
  docName: string
  /** 文档原文 */
  content: string
  /** 文档字符数（用于 token 估算） */
  contentLength: number
  /** 加载时间戳 */
  loadedAt: number
}

/**
 * 会话级知识文档缓存，生命周期与 MemoryManager 绑定
 */
export class KnowledgeCache {
  /** 文档名 → 条目 */
  private entries = new Map<string, KnowledgeEntry>()

  /**
   * 把单个文档写入缓存
   */
  put(docName: string, content: string): void {
    if (!docName || !content) return
    this.entries.set(docName, {
      docName,
      content,
      contentLength: content.length,
      loadedAt: Date.now()
    })
  }

  /**
   * 批量写入
   */
  putBatch(contents: Record<string, string>): void {
    for (const [name, content] of Object.entries(contents)) {
      this.put(name, content)
    }
  }

  /**
   * 是否已缓存某文档
   */
  has(docName: string): boolean {
    return this.entries.has(docName)
  }

  /**
   * 获取已加载的文档名集合
   */
  getLoaded(): Set<string> {
    return new Set(this.entries.keys())
  }

  /**
   * 从期望列表中过滤出真正需要新加载的文档
   */
  filterMissing(docs: string[]): string[] {
    return docs.filter(d => !this.entries.has(d))
  }

  /**
   * 获取单个文档的完整内容
   */
  get(docName: string): string | undefined {
    return this.entries.get(docName)?.content
  }

  /**
   * 估算缓存中所有文档的 token 总数，粗略估算：1.5 字符/token
   */
  estimateTotalTokens(): number {
    let totalChars = 0
    for (const entry of this.entries.values()) {
      totalChars += entry.contentLength
    }
    return Math.ceil(totalChars / 1.5)
  }

  /**
   * 压缩时导出已加载文档清单，防止 compact 后 LLM 忘了已加载过哪些文档
   */
  exportInventory(): string {
    if (this.entries.size === 0) return ''
    const list = Array.from(this.entries.keys()).join('、')
    const totalTokens = this.estimateTotalTokens()
    return `已加载知识文档（${this.entries.size} 个，约 ${totalTokens} tokens）: ${list}`
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.entries.clear()
  }
}
