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

          <!-- 表格区域 (改用 div 模拟) -->
          <div v-else class="preview-table-container">
            <!-- 固定表头 -->
            <div class="table-header" ref="headerWrap">
              <div class="table-row">
                <div class="table-cell header-cell row-index-col">#</div>
                <div
                    v-for="col in columns"
                    :key="col.key"
                    class="table-cell header-cell"
                    :style="{ width: colWidths[col.key] + 'px' }"
                    :title="col.label"
                >
                  <span class="cell-text">{{ col.label }}</span>
                  <!-- 拖拽手柄 -->
                  <div
                      class="resize-handle"
                      @mousedown="startResize($event, col.key)"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 可滚动表体 -->
            <div class="table-body" ref="bodyWrap" @scroll="syncHeaderScroll">
              <div
                  v-for="(row, rowIndex) in displayData"
                  :key="rowIndex"
                  class="table-row body-row"
              >
                <div class="table-cell body-cell row-index-col">{{ rowIndex + 1 }}</div>
                <div
                    v-for="col in columns"
                    :key="col.key"
                    class="table-cell body-cell"
                    :style="{ width: colWidths[col.key] + 'px' }"
                    :title="getCellValue(row, col.key)"
                >
                  {{ getCellValue(row, col.key) }}
                </div>
              </div>
            </div>
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

export default {
  name: 'JsonTablePreview',
  components: { UDialog, UButton },
  props: {
    visible: { type: Boolean, default: false },
    data: { type: [String, Array, Object], default: '' },
    maxRows: { type: Number, default: 200 }
  },
  data() {
    return {
      // 存储每列的实际宽度
      colWidths: {},
      // 拖拽状态
      resizing: false,
      resizeKey: null,
      startX: 0,
      startWidth: 0
    };
  },
  computed: {
    parsedData() {
      if (Array.isArray(this.data)) return this.data;
      if (typeof this.data === 'string') {
        try { return JSON.parse(this.data); } catch { return null; }
      }
      if (this.data && typeof this.data === 'object') return this.data;
      return null;
    },
    isValidArray() {
      return Array.isArray(this.parsedData) && this.parsedData.length > 0;
    },
    emptyMessage() {
      if (!this.data || (typeof this.data === 'string' && !this.data.trim())) return '暂无数据';
      if (!Array.isArray(this.parsedData)) return '数据格式不是 JSON 数组，无法以表格形式预览';
      return 'JSON 数组为空';
    },
    displayData() {
      if (!this.isValidArray) return [];
      return this.maxRows > 0 ? this.parsedData.slice(0, this.maxRows) : this.parsedData;
    },
    rowCount() { return this.isValidArray ? this.parsedData.length : 0; },
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
    },
    columnCount() { return this.columns.length; }
  },
  watch: {
    // 当列发生变化时，重新计算初始宽度
    columns: {
      immediate: true,
      handler(newCols) {
        const widths = {};
        newCols.forEach(col => {
          // 列宽随标题：根据标题长度估算，最小 80px
          const estimated = (col.label || '').length * 14 + 32;
          widths[col.key] = Math.max(estimated, 80);
        });
        this.colWidths = widths;
      }
    }
  },
  methods: {
    closeDialog() { this.$emit('close'); },
    getCellValue(row, key) {
      if (!row || typeof row !== 'object') return '-';
      const val = row[key];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') {
        try { return JSON.stringify(val); } catch { return String(val); }
      }
      return String(val);
    },

    /** 同步表头横向滚动 */
    syncHeaderScroll(e) {
      if (this.$refs.headerWrap) {
        this.$refs.headerWrap.scrollLeft = e.target.scrollLeft;
      }
    },

    /** 开始拖拽列宽 */
    startResize(e, key) {
      e.preventDefault();
      this.resizing = true;
      this.resizeKey = key;
      this.startX = e.clientX;
      this.startWidth = this.colWidths[key];

      document.addEventListener('mousemove', this.onResize);
      document.addEventListener('mouseup', this.stopResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },

    onResize(e) {
      if (!this.resizing) return;
      const diff = e.clientX - this.startX;
      const newWidth = Math.max(60, this.startWidth + diff); // 最小宽度 60px
      // 使用 $set 确保 Vue2 响应式更新
      this.$set(this.colWidths, this.resizeKey, newWidth);
    },

    stopResize() {
      this.resizing = false;
      this.resizeKey = null;
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
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
.preview-info { color: #606266; font-size: 12px; }

/* ---- 空状态 ---- */
.preview-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* ---- 表格容器 ---- */
.preview-table-container {
  display: flex;
  flex-direction: column;
  max-height: 400px; /* 超出最大高度 */
}

/* ---- 表头区域 (固定) ---- */
.table-header {
  flex-shrink: 0;
  overflow-x: auto;
  background: #fafafa;
  border-bottom: 2px solid #e4e7ed;
  scrollbar-width: none; /* 隐藏表头滚动条 */
}
.table-header::-webkit-scrollbar { display: none; }

/* ---- 表体区域 (滚动) ---- */
.table-body {
  flex: 1;
  min-height: 0; /* 关键：允许 flex 子项收缩并出现滚动条 */
  overflow: auto;
}

/* ---- 行与单元格 (Flex 模拟) ---- */
.table-row {
  display: flex;
  min-width: max-content; /* 保证横向滚动时行不被压缩 */
}
.body-row:hover .body-cell { background: #f5f7fa; }

.table-cell {
  padding: 8px 12px;
  box-sizing: border-box;
  flex-shrink: 0; /* 禁止被 flex 压缩，宽度完全由 style 控制 */
  line-height: 20px;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-cell:last-child { border-right: none; }

/* 表头单元格特殊样式 */
.header-cell {
  position: relative;
  color: #303133;
  font-weight: 600;
  user-select: none;
}

/* 序号列固定宽度 */
.row-index-col {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  text-align: center !important;
  color: #909399;
  flex-shrink: 0;
}

/* ---- 拖拽手柄 ---- */
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 1;
}
.resize-handle:hover,
.resize-handle:active {
  background: #409eff; /* 拖拽时高亮提示 */
  opacity: 0.3;
}
</style>