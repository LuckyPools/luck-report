<template>
    <UDialog
      :title="$t('dialog.buildin.selectDatasource')"
      width="600px"
      :visible="visible"
      @close="closeDialog"
    >
      <div class="table-wrapper" v-loading="loading">
        <table class="table-container">
          <thead>
          <tr>
            <td>
              <span>{{ $t('dialog.buildin.datasourceName') }}</span>
            </td>
            <td>
              <span>{{ $t('dialog.buildin.select') }}</span>
            </td>
          </tr>
          </thead>
          <tbody>
          <tr v-for="name in buildinDatasources" :key="name" style="height: 35px;">
            <td>
              <span>{{ name }}</span>
            </td>
            <td>
              <u-button type="info" icon="icon-hand-up" style="border: none;" @click="selectDatasource(name)"></u-button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div slot="footer" style="text-align: right">
        <u-button @click="closeDialog" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      </div>
    </UDialog>
</template>

<script>
import {showAlert} from '@/utils/comnon.js';
import {setDirty} from '@/utils/table.js';
import {loadBuildinDatasources} from '@/api/designer/index.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from '@/components/button/index.vue';
import { LoadingDirective } from '@/components/loading/instance.js';

export default {
  name: 'BuildinDatasourceSelectDialog',
  components: {
    UDialog,
    UButton
  },
  directives: {
    loading: LoadingDirective
  },
  props: {
    datasources: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      buildinDatasources: []
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.buildinDatasources = [];
        this.loading = true;
        this.loadBuildinDatasources();
      }
    }
  },
  methods: {
    async loadBuildinDatasources() {
      try {
        this.buildinDatasources = await loadBuildinDatasources();
        this.loading = false;
      } catch (error) {
        this.loading = false;
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.buildin.loadFail'));
        }
      }
    },
    selectDatasource(name) {
      for (let datasource of this.datasources) {
        if (datasource.name === name) {
          showAlert(`${this.$t('dialog.buildin.datasource')}[${name}]${this.$t('dialog.buildin.datasourceExist')}`);
          return;
        }
      }

      this.$emit('select', { name, type: 'buildin' });

      setDirty();
      this.closeDialog();
    },
    closeDialog() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
</style>
