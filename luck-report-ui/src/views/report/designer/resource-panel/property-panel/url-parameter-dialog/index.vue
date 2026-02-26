<template>
  <UDialog
    :title="$t('dialog.urlParam.title')"
    width="660px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="dialog-content">
       <div class="top-button">
           <u-button
             type="info"
             @click="handleAdd"
             :title="$t('dialog.urlParam.add')"
             icon="icon-plus-circle"
           />
       </div>
      <table class="data-table" style="margin-top: 5px">
        <thead>
          <tr style="background-color: #eeeeee; height: 30px;">
            <td style="width: 150px;"><span>{{ $t('dialog.urlParam.name') }}</span></td>
            <td style="width: 350px;"><span>{{ $t('dialog.urlParam.expr') }}</span></td>
            <td style="width: 100px;"><span>{{ $t('dialog.urlParam.op') }}</span></td>
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
    <URLParameterItemDialog ref="urlParameterItemDialog" @saveAfter="handleSaveAfter" />

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
  data() {
    return {
      visible: false,
      parameters: []
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
    show(parameters) {
      this.visible = true;
      this.parameters = parameters;
    },
    handleAdd() {
      const param = { name: '', value: '' };
      this.$refs.urlParameterItemDialog.show(param, 'add');
    },
    handleEdit(param) {
      this.$refs.urlParameterItemDialog.show(param, 'edit');
    },
    handleSaveAfter({ paramItem, operation }) {
      if (operation === 'add') {
        this.parameters.push(paramItem);
      }
    },
    handleDelete(param, index) {
      let that = this;
      showConfirm(this.$t('dialog.urlParam.delTip')).then(() => {
        that.parameters.splice(index, 1);
      });
    },
    handleClose() {
      this.visible = false;

      // 清理数据
      setTimeout(() => {
        this.parameters = [];
      }, 300); // 等待动画完成
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
