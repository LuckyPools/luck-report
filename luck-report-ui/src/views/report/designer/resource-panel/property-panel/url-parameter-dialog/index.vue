<template>
  <UDialog
    :title="$t('dialog.urlParam.title')"
    width="660px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content table-wrapper">
       <div class="top-button">
           <u-button
             type="info"
             @click="handleAdd"
             :title="$t('dialog.urlParam.add')"
             icon="icon-plus-circle"
           />
       </div>
      <table class="table-container" style="margin-top: 5px">
        <thead>
          <tr>
            <th style="width: 150px;"><span>{{ $t('dialog.urlParam.name') }}</span></th>
            <th style="width: 350px;"><span>{{ $t('dialog.urlParam.expr') }}</span></th>
            <th style="width: 100px;"><span>{{ $t('dialog.urlParam.op') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(param, index) in displayParameters" :key="index" style="height: 30px;">
           <td><span>{{ param.name }}</span></td>
           <td><span>{{ param.value }}</span></td>
           <td>
              <u-button
                  type="info"
                  icon="icon-edit"
                  :title="$t('dialog.urlParam.edit')"
                  @click="handleEdit(param)"
                  style="border: none">
              </u-button>
              <u-button
                  type="info"
                  icon="icon-delete"
                  :title="$t('dialog.urlParam.delete')"
                  @click="handleDelete(param, index)"
                  style="border: none;color: red">
              </u-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- URL参数项对话框 -->
    <URLParameterItemDialog
      :visible="itemDialogVisible"
      :param-item="currentParamItem"
      :operation="currentOperation"
      @update:visible="val => itemDialogVisible = val"
      @saveAfter="handleSaveAfter"
    />

  </UDialog>
</template>

<script>
import { showConfirm } from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import URLParameterItemDialog from '@/views/report/designer/resource-panel/property-panel/url-parameter-dialog/url-parameter-item-dialog/index.vue';
import UButton from "@/components/button/index.vue";

export default {
  name: 'URLParameterDialog',
  components: {
    UButton,
    UDialog,
    URLParameterItemDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    parameters: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible', 'saveAfter', 'parameters-change'],
  data() {
    return {
      itemDialogVisible: false,
      currentParamItem: null,
      currentOperation: 'add'
    };
  },
  computed: {
    displayParameters() {
      return this.parameters || [];
    }
  },
  mounted() {
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    // 移除事件监听
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleAdd() {
      this.currentParamItem = { name: '', value: '' };
      this.currentOperation = 'add';
      this.itemDialogVisible = true;
    },
    handleEdit(param) {
      this.currentParamItem = param;
      this.currentOperation = 'edit';
      this.itemDialogVisible = true;
    },
    handleSaveAfter({ paramItem, operation }) {
      if (operation === 'add') {
        this.$emit('parameters-change', [...this.parameters, paramItem]);
      } else if (operation === 'edit' && this.currentParamItem) {
        this.currentParamItem.name = paramItem.name;
        this.currentParamItem.value = paramItem.value;
        this.$emit('parameters-change', [...this.parameters]);
      }
      this.$emit('saveAfter', { paramItem, operation });
    },
    handleDelete(param, index) {
      let that = this;
      showConfirm(this.$t('dialog.urlParam.delTip')).then(() => {
        const newParameters = [...this.parameters];
        newParameters.splice(index, 1);
        this.$emit('parameters-change', newParameters);
      });
    },
    handleClose() {
      this.$emit('update:visible', false);
    },
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    }
  }
};
</script>

<style scoped>
.top-button{
  display: flex;
  justify-content: end;
}
</style>
