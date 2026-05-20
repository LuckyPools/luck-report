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
      <table class="table-container">
        <thead>
        <tr>
          <td><span>{{ $t('dialog.methodSelect.methodName') }}</span></td>
          <td><span>{{ $t('dialog.methodSelect.select') }}</span></td>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(methodItem, index) in methods" :key="index" style="height: 35px;">
          <td><span>{{ methodItem }}</span></td>
          <td>
            <u-button type="info" icon="icon-hand-up" style="border: none;" @click="selectMethod(methodItem)"></u-button>
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
import {loadMethods} from '@/api/designer/index.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import {showAlert} from "@/utils/comnon";

export default {
  name: 'MethodSelectDialog',
  components: {
    UDialog,
    UButton
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    beanId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      methods: []
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.beanId) {
        this.methods = [];
        this.loadMethods();
      }
    }
  },
  methods: {
    closeDialog() {
      this.$emit('close');
    },

    handleClose() {
      this.closeDialog();
    },

    async loadMethods() {
      this.loading = true;
      try {
        this.methods = await loadMethods(this.beanId);
        this.loading = false;
      } catch (error) {
        this.loading = false;
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(`加载方法[${this.beanId}]失败`);
        }
      }
    },

    selectMethod(methodItem) {
      this.$emit('save', methodItem);
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
</style>
