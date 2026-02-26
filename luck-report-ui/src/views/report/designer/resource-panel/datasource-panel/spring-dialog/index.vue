<template>
    <UDialog
      :title="$t('dialog.springDS.title')"
      width="500px"
      :visible="visible"
      :z-index="20000"
      @close="closeDialog"
    >
        <u-form>
            <u-form-item :label="$t('dialog.springDS.name')" :label-width="120">
                <u-input v-model="dsName" />
            </u-form-item>
            <u-form-item :label="$t('dialog.springDS.bean')" :label-width="120">
                <u-input v-model="beanId" />
            </u-form-item>
        </u-form>
        <div slot="footer" style="text-align: right">
            <u-button @click="closeDialog" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
            <u-button @click="saveData">{{ $t('dialog.common.ok') }}</u-button>
        </div>
    </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UInput from '@/components/input/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';

export default {
  name: 'SpringDialog',
  components: {
    UButton,
    UDialog,
    UInput,
    UForm,
    UFormItem
  },
  props: {
    // 用于比对数据源名称
    datasources: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      visible: false,
      dsName: '',
      beanId: '',
      oldName: null
    };
  },
  methods: {
    show(ds) {
      this.dsName = '';
      this.beanId = '';
      this.oldName = null;

      if (ds) {
        this.oldName = ds.name;
        this.dsName = ds.name;
        this.beanId = ds.beanId;
      }

      this.visible = true;
    },
    saveData() {
      if (this.dsName === '') {
        showAlert(this.$t('dialog.springDS.nameTip'));
        return;
      }

      if (this.beanId === '') {
        showAlert(this.$t('dialog.springDS.beanTip'));
        return;
      }

      let check = false;
      if (!this.oldName || this.dsName !== this.oldName) {
        check = true;
      }

      if (check) {
        for (let source of this.datasources) {
          if (source.name === this.dsName) {
            showAlert(`${this.$t('dialog.springDS.ds')}[${this.dsName}]${this.$t('dialog.springDS.exist')}`);
            return;
          }
        }
      }

      this.$emit('save', {
        name: this.dsName,
        beanId: this.beanId,
        type: 'spring',
        datasets: [],
        oldName: this.oldName
      });
      this.closeDialog();
      setDirty();
    },
    closeDialog() {
      this.visible = false;
    }
  }
};
</script>

<style scoped>
/* 样式可以根据需要自定义 */
</style>
