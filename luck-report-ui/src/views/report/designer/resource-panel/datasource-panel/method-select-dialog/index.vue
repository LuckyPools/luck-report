<template>
  <UDialog
      :title="$t('dialog.methodSelect.title')"
      width="600px"
      :visible="visible"
      @close="closeDialog"
      :loading="loading"
  >
    <div v-if="loading" style="padding: 20px; text-align: center;">
      {{ $t('dialog.methodSelect.load') }}
    </div>
    <div v-else>
      <table class="data-table">
        <thead>
        <tr style="background: #f4f4f4; height: 30px;">
          <td><span>{{ $t('dialog.methodSelect.methodName') }}</span></td>
          <td><span>{{ $t('dialog.methodSelect.select') }}</span></td>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(methodItem, index) in methods" :key="index" style="height: 35px;">
          <td><span>{{ methodItem }}</span></td>
          <td>
            <u-button type="text" icon="icon-hand-up" @click="selectMethod(methodItem)"></u-button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div slot="footer" style="text-align: right">
      <u-button type="info" @click="handleClose" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { loadMethods } from '@/api/designer/index.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import {showAlert} from "@/utils/comnon";

export default {
  name: 'MethodSelectDialog',
  components: {
    UDialog,
    UButton
  },
  data() {
    return {
      visible: false,
      loading: false,
      methods: [],
      beanId: ''
    };
  },
  methods: {
    show(beanId) {
      this.beanId = beanId;
      this.methods = [];
      this.visible = true;
      this.loadMethods();
    },

    closeDialog() {
      this.visible = false;
    },

    handleClose() {
      this.closeDialog();
    },

    async loadMethods() {
      this.loading = true;
      try {
        const response = await loadMethods(this.beanId);
        this.methods = response;
        this.loading = false;
      } catch (error) {
        this.loading = false;
        if (error.msg) {
          showAlert("服务端错误：" + error.msg);
        } else {
          showAlert(`加载方法[${this.beanId}]失败`);
        }
      }
    },

    selectMethod(methodItem) {
      // 通过事件通知父组件
      this.$emit('save', methodItem);
      this.closeDialog();
    }
  }
};
</script>

<style scoped>
</style>
