<template>
  <UDialog
        :title="$t('dialog.staticDataset.jsonPreviewTitle')"
        width="1200px"
        top="50px"
        :visible="visible"
        :z-index="20000"
        @close="closeDialog"
    >
    <div class="preview-body-container">
      <!-- 空状态 -->
      <div v-if="!isValidArray" class="preview-empty">
        {{ emptyMessage }}
      </div>

      <div v-else>
        <!-- 数据统计信息，样式与 preview-data-dialog 一致 -->
        <div style="height: 30px; background: #fdfdfd;">
          <span style="margin: 4px;">{{ $t('dialog.staticDataset.rowCount', { n: rowCount }) }}</span>
        </div>
        <!-- 表格区域，使用全局 table-wrapper / table-container 样式，与 preview-data-dialog 保持一致 -->
        <div class="preview-body-content table-wrapper">
          <table class="table-container" style="table-layout: fixed;">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col.key" style="word-wrap: break-word; width: 120px;">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in displayData" :key="rowIndex">
                <td v-for="col in columns" :key="`${rowIndex}-${col.key}`" style="word-wrap: break-word;">
                  {{ getCellValue(row, col.key) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button type="info" @click="closeDialog">{{ $t('dialog.common.cancel') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import UButton from '@/components/button/index.vue';
import UDialog from "@/components/dialog/index.vue";

export default {
  name: 'JsonTablePreview',
  components: { UDialog, UButton },
  props: {
    visible: { type: Boolean, default: false },
    data: { type: [String, Array, Object], default: '' },
    // 最大展示行数，超过截断
    maxRows: { type: Number, default: 200 }
  },
  computed: {
    /**
     * 方法说明：解析传入的 data 为数组
     * @return {Array|null} 解析后的数组，无法解析时返回 null
     */
    parsedData() {
      if (Array.isArray(this.data)) return this.data;
      if (typeof this.data === 'string') {
        try { return JSON.parse(this.data); } catch { return null; }
      }
      if (this.data && typeof this.data === 'object') return this.data;
      return null;
    },
    /**
     * 方法说明：判断解析结果是否为非空数组
     * @return {boolean} 是否为有效数组
     */
    isValidArray() {
      return Array.isArray(this.parsedData) && this.parsedData.length > 0;
    },
    /**
     * 方法说明：根据数据情况返回空状态提示文案
     * @return {string} 空状态提示
     */
    emptyMessage() {
      if (!this.data || (typeof this.data === 'string' && !this.data.trim())) return this.$t('dialog.staticDataset.empty');
      if (!Array.isArray(this.parsedData)) return this.$t('dialog.staticDataset.notJsonArray');
      return this.$t('dialog.staticDataset.emptyArray');
    },
    /**
     * 方法说明：返回截断到 maxRows 的展示数据
     * @return {Array} 展示数据
     */
    displayData() {
      if (!this.isValidArray) return [];
      return this.maxRows > 0 ? this.parsedData.slice(0, this.maxRows) : this.parsedData;
    },
    /**
     * 方法说明：返回数据总条数
     * @return {number} 行数
     */
    rowCount() { return this.isValidArray ? this.parsedData.length : 0; },
    /**
     * 方法说明：合并所有对象的 key 作为列定义
     * @return {Array} 列对象数组
     */
    columns() {
      if (!this.isValidArray) return [];
      const keySet = new Set();
      const keys = [];
      for (const row of this.parsedData) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          Object.keys(row).forEach((k) => {
            if (!keySet.has(k)) { keySet.add(k); keys.push(k); }
          });
        }
      }
      return keys.map((k) => ({ key: k, label: k }));
    }
  },
  methods: {
    /**
     * 方法说明：关闭预览弹窗
     */
    closeDialog() { this.$emit('close'); },

    /**
     * 方法说明：获取单元格展示值，对象类型转为 JSON 字符串
     * @param {Object} row - 行数据，可为空
     * @param {string} key - 字段名
     * @return {string} 单元格文本
     */
    getCellValue(row, key) {
      if (!row || typeof row !== 'object') return '-';
      const val = row[key];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') {
        try { return JSON.stringify(val); } catch { return String(val); }
      }
      return String(val);
    }
  }
};
</script>

<style scoped>
:root {
    --dialog-height: 600px;
}

/* 容器样式与 preview-data-dialog 保持一致 */
.preview-body-container{
  min-height: 300px;
  max-height: var(--dialog-height);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: black;
}

.preview-body-content {
  min-height: 0;
  max-height: var(--dialog-height);
  overflow-x: scroll;
  margin-top: 2px
}

/* 单元格内边距与文字颜色，与 preview-data-dialog 一致 */
.table-container td{
  padding: 0 5px;
  color: black;
}

/* 空状态 */
.preview-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
