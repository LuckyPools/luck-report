<template>
  <UDialog
      :title="$t('dialog.excelToJson.title')"
      width="800px"
      :visible="visible"
      @close="closeDialog"
  >
    <div class="dialog-content">
      <u-form ref="form" :model="formData" :rules="rules" :label-width="120">
        <!-- 文件上传区域 -->
        <u-form-item :label="$t('dialog.excelToJson.selectFile')" prop="file">
          <div class="excel-upload-area">
            <input
                ref="fileInput"
                type="file"
                accept=".xlsx,.xls"
                style="display: none"
                @change="handleFileChange"
            />
            <u-button native-type="button" size="small" @click="triggerFileSelect">
              {{ $t('dialog.excelToJson.selectFile') }}
            </u-button>
            <span v-if="fileName" class="file-name">{{ fileName }}</span>
            <span v-else class="file-placeholder">{{ $t('dialog.excelToJson.filePlaceholder') }}</span>
          </div>
        </u-form-item>

        <!-- 行范围设置 -->
        <u-form-item :label="$t('dialog.excelToJson.headerRowIndex')">
          <u-input v-model.number="formData.headerRowIndex" style="width: 600px" />
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.firstDataRowIndex')">
          <u-input v-model.number="formData.firstDataRowIndex" style="width: 600px" :placeholder="$t('dialog.excelToJson.autoInfer')" />
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.lastDataRowIndex')">
          <u-input v-model.number="formData.lastDataRowIndex" style="width: 600px" :placeholder="$t('dialog.excelToJson.toEnd')" />
        </u-form-item>

        <!-- 日期与数字格式 -->
        <u-form-item :label="$t('dialog.excelToJson.dateOrder')">
          <u-select v-model="formData.dateOrder" style="width: 600px">
            <u-option v-for="item in dateOrderSelects" :key="item.value" :value="item.value" :label="item.label">{{ item.label }}</u-option>
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.dateSeparator')">
          <u-input v-model="formData.dateSeparator" style="width: 600px" maxlength="1" />
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.timeSeparator')">
          <u-input v-model="formData.timeSeparator" style="width: 600px" maxlength="1" />
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.decimalSymbol')">
          <u-input v-model="formData.decimalSymbol" style="width: 600px" maxlength="1" />
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.dateTimeOrder')">
          <u-select v-model="formData.dateTimeOrder" style="width: 600px">
            <u-option v-for="item in datetimeOrderSelects" :key="item.value" :value="item.value" :label="item.label">{{ item.label }}</u-option>
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.excelToJson.outputDateFormat')">
          <u-input v-model="formData.outputDateFormat" style="width: 600px" placeholder="yyyy-MM-dd HH:mm:ss" />
        </u-form-item>
      </u-form>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="closeDialog" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk" type="primary" :loading="parsing">{{ $t('dialog.excelToJson.parseAndImport') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import request from '@/utils/request'; // TODO: 替换为你项目实际的请求工具路径
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import {parseExcelToJson} from "@/api/designer";
import USelect from "@/components/select/index.vue";
import UOption from "@/components/option/index.vue";

export default {
  name: 'ExcelParseDialog',
  components: {
    USelect,
    UDialog,
    UButton,
    UInput,
    UForm,
    UFormItem,
    UOption
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
      formData: {
        headerRowIndex: 0,
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
      datetimeOrderSelects:[
        { value: 'DT', label: 'DT' },
        { value: 'TD', label: 'TD' }
      ],
      rules: {
        file: [{
          required: true,
          validator: (rule, value, callback) => {
            if (!this.rawFile) {
              callback(new Error(this.$t('dialog.excelToJson.fileRequired')));
            } else {
              callback();
            }
          },
          trigger: 'change'
        }]
      }
    };
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
      this.formData = {
        headerRowIndex: 0,
        firstDataRowIndex: '',
        lastDataRowIndex: '',
        dateOrder: 'YMD',
        dateSeparator: '/',
        timeSeparator: ':',
        decimalSymbol: '.',
        dateTimeOrder: 'DT',
        outputDateFormat: 'yyyy-MM-dd HH:mm:ss'
      };
      // 清除原生 file input 的值，确保同一文件可重复选择
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

      const validExts = ['.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        showAlert(this.$t('dialog.excelToJson.invalidFormat'), 'warning');
        e.target.value = '';
        return;
      }

      this.rawFile = file;
      this.fileName = file.name;
      // 手动触发表单校验以清除错误提示
      this.$refs.form && this.$refs.form.validateField('file');
    },

    closeDialog() {
      this.$emit('close');
    },

    /** 表单校验封装，与 DatasourceDialog 保持一致 */
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.form.validate((valid) => {
          resolve(valid);
        });
      });
    },

    /** 点击确认按钮 */
    async handleOk() {
      const valid = await this.validateForm();
      if (!valid) return;

      this.parsing = true;
      try {
        const formPayload = new FormData();
        formPayload.append('file', this.rawFile);

        // 仅追加非空参数，空字符串/undefined 由后端走默认值
        Object.keys(this.formData).forEach((key) => {
          const val = this.formData[key];
          if (val !== '' && val !== undefined && val !== null) {
            formPayload.append(key, val);
          }
        });

        const res = await parseExcelToJson(formPayload);
        // 兼容 { code, data } 或直接返回数据的响应结构
        const jsonData = res.data !== undefined ? res.data : res;
        const jsonString = typeof jsonData === 'string'
            ? jsonData
            : JSON.stringify(jsonData, null, 2);

        //  对外广播解析后的 JSON 字符串
        this.$emit('json-imported', jsonString);
        this.closeDialog();
      } catch (error) {
        console.error('Excel parse error:', error);
        const msg = error?.msg || error?.message || this.$t('dialog.excelToJson.parseFail');
        showAlert(msg, { useHTMLString: true });
      } finally {
        this.parsing = false;
      }
    }
  }
};
</script>

<style scoped>
.excel-upload-area {
  display: flex;
  align-items: center;
  width: 600px;
}

.file-name {
  margin-left: 12px;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 480px;
}

.file-placeholder {
  margin-left: 12px;
  color: #999;
  font-size: 14px;
}
</style>