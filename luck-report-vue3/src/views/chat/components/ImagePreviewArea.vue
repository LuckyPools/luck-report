<template>
  <div v-if="uploadedImages.length > 0" class="image-preview-area">
    <div class="image-row">
      <div
        v-for="(image, index) in uploadedImages"
        :key="index"
        class="image-item"
      >
        <a-image
          :src="image.url"
          :width="64"
          :height="64"
          class="preview-image"
          :preview="{ mask: false }"
        />
        <div class="remove-btn" @click="emit('remove', index)">
          <CloseOutlined class="remove-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Image as AImage } from 'ant-design-vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import type { UploadedImage } from '../composables/useImageUpload'

/**
 * ImagePreviewArea 组件
 * 对应 HiveChat ImagePreviewArea，在输入框上方展示已上传图片的缩略图预览
 * 支持点击预览大图、hover 显示删除按钮
 */

interface Props {
  uploadedImages: UploadedImage[]
}

interface Emits {
  (e: 'remove', index: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.image-preview-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4px 16px 0;
}

.image-row {
  display: flex;
  flex-direction: row;
  height: 64px;
  width: 100%;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.image-item :deep(.ant-image) {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.preview-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.image-item:hover .remove-btn {
  display: flex;
}

.remove-icon {
  font-size: 10px;
  color: #6b7280;
}
</style>
