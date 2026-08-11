<template>
  <UDialog
      :title="$t('dialog.staticDataset.jsonPreviewTitle')"
      width="1000px"
      top="10vh"
      :visible="visible"
      :z-index="20005"
      @close="closeDialog"
  >
    <div class="dialog-content">
      <div class="content-layout">

        <div class="json-table-preview">
          <!-- 工具栏 -->
          <div class="preview-toolbar">
      <span class="preview-info">
        共 {{ rowCount }} 行，{{ columnCount }} 列
      </span>
          </div>

          <!-- 空状态 -->
          <div v-if="!isValidArray" class="preview-empty">
            {{ emptyMessage }}
          </div>

          <!-- 表格区域 -->
          <div v-else class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
              <tr>
                <th class="row-index-col">#</th>
                <th v-for="col in columns" :key="col.key" :title="col.key">
                  {{ col.label }}
                </th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(row, rowIndex) in displayData" :key="rowIndex">
                <td class="row-index-col">{{ rowIndex + 1 }}</td>
                <td v-for="col in columns" :key="col.key" :title="getCellValue(row, col.key)">
                  {{ getCellValue(row, col.key) }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>


      </div>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="closeDialog">{{ $t('dialog.json.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import UButton from '@/components/button/index.vue';
import UDialog from "@/components/dialog/index.vue";
import JsonEditor
  from "@/views/report/designer/resource-panel/datasource-panel/static-dataset-dialog/json-editor/index.vue";

export default {
  name: 'JsonTablePreview',
  components: { UDialog, UButton },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    /** JSON 字符串或已解析的数组/对象 */
    data: {
      type: [String, Array, Object],
      default: ''
    },
    /** 最大预览行数，0 表示不限制 */
    maxRows: {
      type: Number,
      default: 200
    }
  },
  computed: {
    /** 安全解析后的原始数据 */
    parsedData() {
      if (Array.isArray(this.data)) return this.data;
      if (typeof this.data === 'string') {
        try {
          return JSON.parse(this.data);
        } catch {
          return null;
        }
      }
      if (this.data && typeof this.data === 'object') return this.data;
      return null;
    },

    /** 是否为合法非空数组 */
    isValidArray() {
      return Array.isArray(this.parsedData) && this.parsedData.length > 0;
    },

    /** 空状态提示文案 */
    emptyMessage() {
      if (!this.data || (typeof this.data === 'string' && !this.data.trim())) {
        return '暂无数据';
      }
      if (!Array.isArray(this.parsedData)) {
        return '数据格式不是 JSON 数组，无法以表格形式预览';
      }
      return 'JSON 数组为空';
    },

    /** 实际展示的数据（受 maxRows 限制） */
    displayData() {
      if (!this.isValidArray) return [];
      if (this.maxRows > 0) {
        return this.parsedData.slice(0, this.maxRows);
      }
      return this.parsedData;
    },

    rowCount() {
      return this.isValidArray ? this.parsedData.length : 0;
    },

    /** 自动从所有行中提取列名（取并集，保持首次出现顺序） */
    columns() {
      if (!this.isValidArray) return [];
      const keySet = new Set();
      const keys = [];
      for (const row of this.parsedData) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          Object.keys(row).forEach((k) => {
            if (!keySet.has(k)) {
              keySet.add(k);
              keys.push(k);
            }
          });
        }
      }
      return keys.map((k) => ({ key: k, label: k }));
    },

    columnCount() {
      return this.columns.length;
    }
  },
  methods: {
    closeDialog() {
      this.$emit('close');
    },
    /**
     * 获取单元格显示值
     * - null / undefined → "-"
     * - 对象 / 数组 → 紧凑 JSON 字符串
     * - 其他 → String()
     */
    getCellValue(row, key) {
      if (!row || typeof row !== 'object') return '-';
      const val = row[key];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      return String(val);
    },

    /** 复制原始 JSON 到剪贴板 */
    async copyJson() {
      const text = typeof this.data === 'string'
          ? this.data
          : JSON.stringify(this.data, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        this.$emit('copied');
      } catch {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.$emit('copied');
      }
    }
  }
};
</script>

<style scoped>
.json-table-preview {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  font-size: 13px;
}

/* ---- 工具栏 ---- */
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.preview-info {
  color: #606266;
  font-size: 12px;
}

/* ---- 空状态 ---- */
.preview-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ---- 表格容器（横向+纵向滚动） ---- */
.preview-table-wrapper {
  max-height: 400px;
  overflow: auto;
}

/* ---- 表格本体 ---- */
.preview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  white-space: nowrap;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 100px;
  max-width: 300px;
}

.preview-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fafafa;
  color: #303133;
  font-weight: 600;
  border-bottom: 2px solid #e4e7ed;
}

.preview-table tbody tr:hover {
  background: #f5f7fa;
}

/* 序号列固定宽度 */
.row-index-col {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  text-align: center !important;
  color: #909399;
}

/* 去除最后一列右边框 */
.preview-table th:last-child,
.preview-table td:last-child {
  border-right: none;
}
</style>