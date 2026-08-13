<template>
  <UDialog
      :title="$t('dialog.excelToJson.title')"
      width="860px"
      top="10vh"

      :visible="visible"
      @close="closeDialog"
      class="excel-parse-dialog"
      custom-class="excel-parse-dialog"
  >
    <!-- 步骤条 -->
    <div class="step-bar">
      <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{
          'is-active': curStep === index + 1,
          'is-completed': curStep > index + 1
        }"
      >
        <div class="step-indicator">
          <span v-if="curStep <= index + 1" class="step-number">{{ index + 1 }}</span>
          <i v-else class="step-check">✓</i>
        </div>
        <span class="step-title">{{ step.label }}</span>
        <div v-if="index < steps.length - 1" class="step-line"></div>
      </div>
    </div>

    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" label-position="top">

        <!-- Step 1: 文件上传 -->
        <div v-show="curStep === 1" class="step-content">
          <div class="step-body-wrapper">
            <div
                class="upload-zone"
                :class="{ 'is-dragging': isDragging, 'has-file': !!fileName }"
                @click="triggerFileSelect"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
            >
              <input
                  ref="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  style="display: none"
                  @change="handleFileChange"
              />

              <div class="upload-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>

              <div class="upload-text">
                <template v-if="fileName">
                  <p class="file-name-display">{{ fileName }}</p>
                  <p class="file-hint">{{ $t('dialog.excelToJson.clickToReplace')  }}</p>
                </template>
                <template v-else>
                  <p class="main-text">
                    {{ $t('dialog.excelToJson.dragOrClick')}}
                  </p>
                  <p class="sub-text">{{ $t('dialog.excelToJson.filePlaceholder') }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Sheet 选择 -->
        <div v-show="curStep === 2" class="step-content">
          <div class="step-body-wrapper">
            <div class="sheet-list">
            <div
                v-for="sheet in sheetList"
                :key="sheet.index"
                class="sheet-card"
                :class="{ 'is-selected': formData.sheetIndex === sheet.index }"
                @click="formData.sheetIndex = sheet.index"
            >
              <span class="sheet-radio-dot"></span>
              <div class="sheet-info">
                <span class="sheet-name">{{ sheet.name }}</span>
              </div>
            </div>

            <div v-if="!sheetList.length" class="empty-sheet">
              {{ $t('dialog.excelToJson.noSheets') }}
            </div>
            </div>
          </div>
        </div>

        <!-- Step 3: 配置选项 -->
        <div v-show="curStep === 3" class="step-content config-step">

          <!-- 分组1: 行范围 -->
          <div class="config-group">
            <h4 class="group-title">{{ $t('dialog.excelToJson.rowSettings')  }}</h4>
            <u-row :gutter="10">
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.headerRowIndex')" prop="headerRowIndex" required>
                  <u-input v-model.number="formData.headerRowIndex" />
                </u-form-item>
              </u-col>
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.firstDataRowIndex')" prop="firstDataRowIndex">
                  <u-input v-model.number="formData.firstDataRowIndex" :placeholder="$t('dialog.excelToJson.autoInfer')" />
                </u-form-item>
              </u-col>
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.lastDataRowIndex')" prop="lastDataRowIndex">
                  <u-input v-model.number="formData.lastDataRowIndex" :placeholder="$t('dialog.excelToJson.toEnd')" />
                </u-form-item>
              </u-col>
            </u-row>
          </div>

          <!-- 分组2: 日期与时间 -->
          <div class="config-group">
            <h4 class="group-title">{{ $t('dialog.excelToJson.dateTimeSettings') }}</h4>
            <u-row :gutter="20">
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.dateOrder')">
                  <u-select v-model="formData.dateOrder">
                    <u-option v-for="item in dateOrderSelects" :key="item.value" :value="item.value" :label="item.label" />
                  </u-select>
                </u-form-item>
              </u-col>
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.dateTimeOrder')">
                  <u-select v-model="formData.dateTimeOrder">
                    <u-option v-for="item in datetimeOrderSelects" :key="item.value" :value="item.value" :label="item.label" />
                  </u-select>
                </u-form-item>
              </u-col>
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.outputDateFormat')">
                  <u-input v-model="formData.outputDateFormat" placeholder="yyyy-MM-dd HH:mm:ss" />
                </u-form-item>
              </u-col>
            </u-row>
            <u-row :gutter="20">
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.dateSeparator')">
                  <u-input v-model="formData.dateSeparator" maxlength="1" />
                </u-form-item>
              </u-col>
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.timeSeparator')">
                  <u-input v-model="formData.timeSeparator" maxlength="1" />
                </u-form-item>
              </u-col>
            </u-row>
          </div>

          <!-- 分组3: 数字格式 -->
          <div class="config-group">
            <h4 class="group-title">{{ $t('dialog.excelToJson.numberSettings')}}</h4>
            <u-row :gutter="20">
              <u-col span="8">
                <u-form-item :label="$t('dialog.excelToJson.decimalSymbol')">
                  <u-input v-model="formData.decimalSymbol" maxlength="1" />
                </u-form-item>
              </u-col>
            </u-row>
          </div>

        </div>
      </u-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <u-button v-if="curStep > 1" type="info" @click="setStep(curStep - 1)">
        {{ $t('dialog.common.prev') }}
      </u-button>

      <u-button
          v-if="curStep < 3"
          type="primary"
          @click="setStep(curStep + 1)"
      >
        {{ $t('dialog.common.next') }}
      </u-button>

      <u-button
          v-if="curStep === 3"
          type="primary"
          :loading="parsing"
          @click="handleOk"
      >
        {{ $t('dialog.excelToJson.parseAndImport') }}
      </u-button>
    </div>
  </UDialog>
</template>

<script>
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { parseExcelToJson, getExcelSheet } from "@/api/designer";
import USelect from "@/components/select/index.vue";
import UOption from "@/components/option/index.vue";
import URow from "@/components/row/index.vue";
import UCol from "@/components/col/index.vue";
import { showAlert } from "@/utils/comnon";

export default {
  name: 'ExcelParseDialog',
  components: {
    USelect,
    UDialog,
    UButton,
    UInput,
    UForm,
    UFormItem,
    UOption,
    URow,
    UCol
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      rawFile: null,
      fileName: '',
      parsing: false,
      isDragging: false,
      formData: {
        sheetIndex: null,
        headerRowIndex: 1,
        firstDataRowIndex: '',
        lastDataRowIndex: '',
        dateOrder: 'YMD',
        dateSeparator: '/',
        timeSeparator: ':',
        decimalSymbol: '.',
        dateTimeOrder: 'DT',
        outputDateFormat: 'yyyy-MM-dd HH:mm:ss'
      },
      dateOrderSelects: [
        { value: 'YMD', label: 'YMD' },
        { value: 'DMY', label: 'DMY' },
        { value: 'MDY', label: 'MDY' }
      ],
      datetimeOrderSelects: [
        { value: 'DT', label: 'DT' },
        { value: 'TD', label: 'TD' }
      ],
      rules: {
        // 字段名行：必填，必须为数字且大于等于1（对应Excel第1行起）
        // 注：不使用 async-validator 的 required 规则，因其未指定 type 时默认按 string 校验，
        // 而 v-model.number 产出的是 number 类型，会被误判为空触发"请输入"。必填语义在 validator 内统一处理。
        headerRowIndex: [
          {
            validator: (rule, value, callback) => {
              if (value === '' || value === null || value === undefined) {
                callback(new Error(this.$t('dialog.excelToJson.headerRowRequired')));
                return;
              }
              const num = Number(value);
              if (isNaN(num)) {
                callback(new Error(this.$t('dialog.excelToJson.headerRowMustBeNumber')));
              } else if (num < 1) {
                callback(new Error(this.$t('dialog.excelToJson.headerRowMustBeMinOne')));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        // 第一个数据行：可为空（留空时后端自动取字段名行下一行），填则必须为数字且大于等于1
        firstDataRowIndex: [
          {
            validator: (rule, value, callback) => {
              if (value === '' || value === null || value === undefined) {
                callback();
                return;
              }
              const num = Number(value);
              if (isNaN(num)) {
                callback(new Error(this.$t('dialog.excelToJson.mustBeNumber')));
              } else if (num < 1) {
                callback(new Error(this.$t('dialog.excelToJson.mustBeMinOne')));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        // 最后一个数据行：可为空（留空时解析到Sheet末尾），填则必须为数字且大于等于1
        lastDataRowIndex: [
          {
            validator: (rule, value, callback) => {
              if (value === '' || value === null || value === undefined) {
                callback();
                return;
              }
              const num = Number(value);
              if (isNaN(num)) {
                callback(new Error(this.$t('dialog.excelToJson.mustBeNumber')));
              } else if (num < 1) {
                callback(new Error(this.$t('dialog.excelToJson.mustBeMinOne')));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      },
      curStep: 1,
      sheetList: []
    };
  },
  computed: {
    steps() {
      return [
        { label: this.$t('dialog.excelToJson.selectFile') },
        { label: this.$t('dialog.excelToJson.selectSheet') },
        { label: this.$t('dialog.excelToJson.selectExcelOption') }
      ];
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    /** 重置表单状态 */
    resetForm() {
      this.rawFile = null;
      this.fileName = '';
      this.parsing = false;
      this.isDragging = false;
      this.curStep = 1;
      this.sheetList = [];
      this.formData = {
        sheetIndex: null,
        headerRowIndex: 1,
        firstDataRowIndex: '',
        lastDataRowIndex: '',
        dateOrder: 'YMD',
        dateSeparator: '/',
        timeSeparator: ':',
        decimalSymbol: '.',
        dateTimeOrder: 'DT',
        outputDateFormat: 'yyyy-MM-dd HH:mm:ss'
      };
      this.$nextTick(() => {
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
        this.$refs.form && this.$refs.form.resetFields();
      });
    },

    /** 触发隐藏的文件选择框 */
    triggerFileSelect() {
      this.$refs.fileInput && this.$refs.fileInput.click();
    },

    /** 处理文件选中 */
    handleFileChange(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      this.validateAndSetFile(file);
    },

    /** 处理拖拽上传 */
    handleDrop(e) {
      this.isDragging = false;
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      this.validateAndSetFile(file);
    },

    /** 校验并设置文件 */
    validateAndSetFile(file) {
      const validExts = ['.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        showAlert(this.$t('dialog.excelToJson.invalidFormat'), 'warning');
        return;
      }
      this.rawFile = file;
      this.fileName = file.name;
    },

    closeDialog() {
      this.$emit('close');
    },

    /** 表单校验封装 */
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    /** 点击确认按钮 */
    async handleOk() {
      // 提交前校验行号配置，校验失败直接返回，不进入 loading
      const valid = await this.validateForm();
      if (!valid) return;
      this.parsing = true;
      try {
        const formPayload = new FormData();
        formPayload.append('file', this.rawFile);

        Object.keys(this.formData).forEach((key) => {
          const val = this.formData[key];
          if (val !== '' && val !== undefined && val !== null) {
            formPayload.append(key, val);
          }
        });

        const res = await parseExcelToJson(formPayload);
        const jsonData = res.data !== undefined ? res.data : res;
        const jsonString = typeof jsonData === 'string'
            ? jsonData
            : JSON.stringify(jsonData, null, 2);

        this.$emit('json-imported', jsonString);
        this.closeDialog();
      } catch (error) {
        console.error('Excel parse error:', error);
        const msg = error?.msg || error?.message || this.$t('dialog.excelToJson.parseFail');
        showAlert(msg, { useHTMLString: true });
      } finally {
        this.parsing = false;
      }
    },

    async setStep(nextStep) {
      if (nextStep === 2) {
        if (!this.rawFile) {
          showAlert(this.$t('dialog.excelToJson.fileRequired'), 'warning');
          return;
        }
        try {
          const res = await getExcelSheet(this.rawFile);
          if (res) {
            this.sheetList = res;
            // 仅有一个 sheet 时默认选中，省去用户手动点击
            if (res.length === 1) {
              this.formData.sheetIndex = res[0].index;
            }
          }
        } catch (error) {
          console.error('Get Excel sheet error:', error);
          showAlert(this.$t('dialog.excelToJson.getSheetError'), 'error');
        }
      } else if (nextStep === 3) {
        if (this.formData.sheetIndex == null) {
          showAlert(this.$t('dialog.excelToJson.sheetRequired'), 'warning');
          return;
        }
      }
      this.curStep = nextStep;
    }
  }
};
</script>

<style scoped>

.dialog-content {
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

.step-content {
  width: 100%;
  box-sizing: border-box;
}
.excel-parse-dialog {
  --ep-primary: var(--primary-color, #00554a);
  --ep-primary-light: var(--primary-light-color, rgba(0, 85, 74, 0.08));
  --ep-border: #e4e7ed;
  --ep-text-main: #303133;
  --ep-text-sub: #909399;
}


/* ========== 步骤条 ========== */
.step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.step-item {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-item:last-child {
  flex: 0;
}

.step-item:last-child .step-line {
  display: none;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f2f5;
  color: var(--ep-text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-number {
  font-style: normal;
}

.step-check {
  font-style: normal;
  font-size: 14px;
}

.step-title {
  margin-left: 10px;
  font-size: 14px;
  color: var(--ep-text-sub);
  white-space: nowrap;
  transition: color 0.3s;
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--ep-border);
  margin: 0 16px;
  transition: background 0.3s;
}

/* 激活状态 */
.step-item.is-active .step-indicator {
  background: var(--ep-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 85, 74, 0.3);
}

.step-item.is-active .step-title {
  color: var(--ep-primary);
  font-weight: 600;
}

/* 完成状态 */
.step-item.is-completed .step-indicator {
  background: var(--ep-primary);
  color: #fff;
}

.step-item.is-completed .step-title {
  color: var(--ep-text-main);
}

.step-item.is-completed .step-line {
  background: var(--ep-primary);
}

/* 步骤内容外层容器：固定高度，超出内部滚动，保证"上传文件"与"选择sheet"两步骤高度一致 */
.step-body-wrapper {
  height: 250px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* ========== 上传区域 ========== */
.upload-zone {
  border: 2px dashed var(--ep-border);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fafbfc;
  /* 撑满 wrapper 高度，上传区铺满固定区域 */
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover,
.upload-zone.is-dragging {
  border-color: var(--ep-primary);
  background: var(--ep-primary-light);
}

.upload-zone.has-file {
  border-style: solid;
  border-color: var(--ep-primary);
  background: var(--ep-primary-light);
}

.upload-icon {
  color: var(--ep-text-sub);
  margin-bottom: 16px;
  transition: color 0.25s;
}

.upload-zone:hover .upload-icon,
.upload-zone.has-file .upload-icon {
  color: var(--ep-primary);
}

.main-text {
  font-size: 16px;
  color: var(--ep-text-main);
  margin: 0 0 6px;
}

.sub-text {
  font-size: 13px;
  color: var(--ep-text-sub);
  margin: 0;
}

.file-name-display {
  font-size: 16px;
  color: var(--ep-primary);
  font-weight: 600;
  margin: 0 0 6px;
  word-break: break-all;
}

.file-hint {
  font-size: 13px;
  color: var(--ep-text-sub);
  margin: 0;
}

/* ========== Sheet 列表 ========== */
.sheet-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  padding: 4px;
  box-sizing: border-box;
}

.sheet-card {
  display: flex;
  align-items: center;
  height: 40px;
  box-sizing: border-box;
  padding: 0 16px;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.sheet-card:hover {
  border-color: var(--ep-primary);
  background: var(--ep-primary-light);
}

.sheet-card.is-selected {
  border-color: var(--ep-primary);
  background: var(--ep-primary-light);
  box-shadow: 0 0 0 1px var(--ep-primary) inset;
}

/* 左侧 radio 圆点，样式与 u-radio 一致，主题色 #00554a */
.sheet-radio-dot {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-right: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  background-color: #fff;
  position: relative;
  box-sizing: border-box;
}

/* 选中时圆点内显示主题色实心小圆 */
.sheet-card.is-selected .sheet-radio-dot {
  background-color: #00554a;
  border-color: #00554a;
}

.sheet-card.is-selected .sheet-radio-dot::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: #fff;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.sheet-info {
  flex: 1;
  min-width: 0;
}

.sheet-name {
  font-size: 14px;
  color: var(--ep-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-sheet {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 0;
  color: var(--ep-text-sub);
  font-size: 14px;
}

/* ========== 配置分组 ========== */
.config-step {
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  margin: 0;
}

/* ========== 防横向溢出兜底 ========== */
.dialog-content,
.step-content,
.config-group {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}


.config-group {
  margin-bottom: 12px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ep-text-main);
  margin: 0 0 16px;
  padding-left: 10px;
  border-left: 3px solid var(--ep-primary);
  line-height: 1;
}

/* ========== Footer ========== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ========== 滚动条美化 ========== */
.config-step::-webkit-scrollbar,
.sheet-list::-webkit-scrollbar {
  width: 6px;
}

.config-step::-webkit-scrollbar-thumb,
.sheet-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}
</style>

<!-- ⬇️ 新增：非 scoped 样式块，专门用于约束挂载到 body 的 UDialog -->
<style>
.excel-parse-dialog.u-dialog-wrap {
  /* 第一道防线：限制弹窗最大宽度，防止窄屏溢出 */
  max-width: calc(100vw - 32px) !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.excel-parse-dialog .u-dialog-wrap-content {
  /* 核心修复：约束内容区宽度并隐藏横向滚动条 */
  width: 100% !important;
  box-sizing: border-box !important;
  overflow-x: hidden !important;
}

/* 从根源消除 u-row gutter 负边距导致的溢出 */
.excel-parse-dialog .u-dialog-wrap-content .u-row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.excel-parse-dialog .u-dialog-wrap-content .u-col {
  padding-left: 10px !important;
  padding-right: 10px !important;
}


</style>
