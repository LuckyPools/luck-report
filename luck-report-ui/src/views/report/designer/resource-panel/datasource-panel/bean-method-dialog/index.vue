<template>
  <div>
    <!-- Bean方法配置对话框 -->
    <UDialog
      :title="$t('dialog.bean.beanDatasetConfig')"
      width="600px"
      :visible="visible"
      @close="closeDialog"
    >
      <div class="dialog-content">
        <u-form ref="form" :label-width="120">
          <u-form-item :label="$t('dialog.bean.datasetName')">
            <u-input v-model="name" style="width: 400px" />
          </u-form-item>

          <u-form-item :label="$t('dialog.bean.methodName')">
            <div class="input-group">
              <u-input v-model="method" :placeholder="$t('dialog.bean.methodParameters')" style="width: 300px" />
              <span class="input-group-btn">
                <u-button type="primary" @click.prevent="selectMethod">{{ $t('dialog.bean.selectMethod') }}</u-button>
              </span>
            </div>
          </u-form-item>

          <u-form-item :label="$t('dialog.bean.returnObject')">
            <u-input v-model="clazz" :placeholder="$t('dialog.bean.className')" style="width: 400px" />
          </u-form-item>
        </u-form>
      </div>

      <div slot="footer" style="text-align: right">
        <u-button type="info" @click="handleClose" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
        <u-button type="primary" @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
      </div>
    </UDialog>

    <!-- 方法选择对话框 -->
    <MethodSelectDialog
      :visible="methodSelectDialogVisible"
      :beanId="beanId"
      @save="handleMethodSelect"
      @close="methodSelectDialogVisible = false"
    />
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import MethodSelectDialog from '@/views/report/designer/resource-panel/datasource-panel/method-select-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import {showAlert} from "@/utils/comnon";

export default {
  name: 'BeanMethodDialog',
  components: {
    MethodSelectDialog,
    UDialog,
    UButton,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    datasources: {
      type: Array,
      default: () => []
    },
    beanId: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      oldName: '',
      name: '',
      method: '',
      clazz: '',
      methodSelectDialogVisible: false
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initData();
      }
    },
    dataset(newVal) {
      if (newVal) {
        this.initData();
      }
    }
  },
  methods: {
    initData() {
      this.name = '';
      this.method = '';
      this.clazz = '';
      this.oldName = '';

      if (this.dataset) {
        this.oldName = this.dataset.name;
        this.name = this.dataset.name;
        this.method = this.dataset.method;
        this.clazz = this.dataset.clazz;
      }
    },

    closeDialog() {
      this.$emit('close');
    },

    handleClose() {
      this.closeDialog();
    },

    handleOk() {
      this.save();
    },

    selectMethod(event) {
      if (event) {
        event.preventDefault();
      }
      this.methodSelectDialogVisible = true;
    },

    handleMethodSelect(method) {
      this.method = method;
    },

    validateName() {
      let check = false;
      if (!this.oldName || this.name !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let datasource of this.datasources) {
          // 确保datasets属性存在且可迭代
          let datasets = datasource.datasets;
          if (!datasets || !Array.isArray(datasets)) {
            continue;
          }

          for (let dataset of datasets) {
            if (dataset.name === this.name) {
              showAlert(`数据集[${this.name}]已存在`);
              return false;
            }
          }
        }
      }
      return true;
    },

    save() {
      if (!this.validateName()) {
        return;
      }

      this.$emit('save', this.name, this.method, this.clazz, this.oldName);

      setDirty();
      this.closeDialog();
    }
  }
};
</script>

<style scoped>
.dialog-content {
  padding: 20px;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group-btn {
  margin-left: 10px;
}

.btn {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
}

.btn:hover {
  background-color: #e6e6e6;
}
</style>
