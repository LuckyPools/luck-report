import { ref } from 'vue'
import { message as antMessage } from 'ant-design-vue'

/**
 * 已上传图片项
 */
export interface UploadedImage {
  /** 预览 URL（blob URL 或 data URL） */
  url: string
  /** 原始文件对象 */
  file: File
}

/**
 * 图片上传管理 Hook
 * 对应 HiveChat useImageUpload，管理图片上传、预览、删除
 * 支持点击上传、粘贴上传、拖拽上传
 *
 * @param maxImages - 最大图片数量，默认 5
 */
export function useImageUpload(maxImages: number = 5) {
  const uploadedImages = ref<UploadedImage[]>([])

  /**
   * 将 File 对象转换为 Base64 编码字符串
   *
   * @param file - 需要转换的文件
   * @returns Base64 编码的字符串
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 校验文件是否为合法图片
   * 限制大小 5MB，类型必须为 image/*
   *
   * @param file - 待校验的文件
   * @returns 是否合法
   */
  const validateImageFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      antMessage.warning('图片大小不能超过 5MB')
      return false
    }
    if (!file.type.startsWith('image/')) {
      antMessage.warning('只能上传图片文件')
      return false
    }
    return true
  }

  /**
   * 处理图片上传
   * 支持两种模式：
   * 1. 传入 file+url：直接添加（用于粘贴/拖拽场景）
   * 2. 不传参数：弹出文件选择对话框
   *
   * @param file - 可选，已获取的文件对象
   * @param url - 可选，文件的预览 URL
   */
  const handleImageUpload = async (file?: File, url?: string) => {
    if (file && url) {
      if (!validateImageFile(file)) return
      if (uploadedImages.value.length >= maxImages) {
        antMessage.warning(`最多上传 ${maxImages} 张图片`)
        return
      }
      uploadedImages.value.push({ url, file })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true

    input.onchange = async (e: Event) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      const fileArray = Array.from(files)
      if (fileArray.length + uploadedImages.value.length > maxImages) {
        antMessage.warning(`最多上传 ${maxImages} 张图片`)
        return
      }

      for (const f of fileArray) {
        if (!validateImageFile(f)) return
      }

      const newImages = fileArray.map(f => ({
        url: URL.createObjectURL(f),
        file: f
      }))
      uploadedImages.value.push(...newImages)
    }
    input.click()
  }

  /**
   * 删除指定索引的图片
   * 释放 blob URL 避免内存泄漏
   *
   * @param index - 图片索引
   */
  const removeImage = (index: number) => {
    const img = uploadedImages.value[index]
    if (img?.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
    uploadedImages.value.splice(index, 1)
  }

  /**
   * 将所有已上传图片转为 Attachment 格式（Base64）
   * 用于发送消息时构造 attachments 参数
   *
   * @returns Attachment 数组
   */
  const getAttachments = async (): Promise<Array<{ mimeType: string; data: string }>> => {
    const results: Array<{ mimeType: string; data: string }> = []
    for (const img of uploadedImages.value) {
      const base64 = await fileToBase64(img.file)
      // data URL 格式为 "data:mime/type;base64,xxxxx"，需要去掉前缀
      const base64Data = base64.split(',')[1]
      results.push({
        mimeType: img.file.type,
        data: base64Data
      })
    }
    return results
  }

  /**
   * 清空所有已上传图片
   * 释放所有 blob URL
   */
  const clearImages = () => {
    for (const img of uploadedImages.value) {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url)
      }
    }
    uploadedImages.value = []
  }

  return {
    uploadedImages,
    maxImages,
    handleImageUpload,
    removeImage,
    getAttachments,
    clearImages
  }
}
