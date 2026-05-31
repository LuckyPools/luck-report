import { ref } from 'vue'

/**
 * 全局配置管理 Hook
 * 对应 HiveChat useGlobalConfigStore，管理联网搜索开关等全局配置
 * 当前使用本地状态，后续可对接后端 API 获取配置
 */
export function useGlobalConfig() {
  /** 是否启用联网搜索功能（全局开关，由管理员配置） */
  const searchEnable = ref(false)

  /**
   * 设置联网搜索开关
   * @param value - 是否启用
   */
  const setSearchEnable = (value: boolean) => {
    searchEnable.value = value
  }

  return {
    searchEnable,
    setSearchEnable
  }
}
