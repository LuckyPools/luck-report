<template>
  <UDialog
    :title="$t('dialog.open.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="open-dialog-content">
      <u-form :label-width="80" label-position="left">
        <u-form-item :label="$t('dialog.open.source')" class="property-label">
          <u-select
            v-model="selectedProvider"
            @change="handleProviderChange"
          >
            <u-option
              v-for="option in providerOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>

        <u-form-item :label="$t('dialog.save.currentPath')" class="property-label">
          <div class="path-content">
            <div class="path-breadcrumb">
              <span class="path-segment" @click="navigateToPath(-1)">/</span>
              <template v-for="(segment, index) in pathSegments">
                <span class="path-segment" :key="'seg-' + index" @click="navigateToPath(index)">
                  {{ segment }}
                </span>
                <span class="path-separator" :key="'sep-' + index">/</span>
              </template>
            </div>
            <u-button
              v-if="canGoBack"
              @click="goBack"
              type="info"
              size="small"
              icon="icon-undo"
            >
              {{ $t('dialog.save.backToParent') }}
            </u-button>
          </div>
        </u-form-item>
      </u-form>

      <div class="file-list-container table-wrapper" v-loading="loading">
        <table class="table-container">
          <thead class="table-container-header">
            <tr>
              <th><span>{{ $t('dialog.open.fileName') }}</span></th>
              <th style="width:200px;"><span>{{ $t('dialog.open.modDate') }}</span></th>
              <th style="width:80px;"><span>{{ $t('dialog.open.operator') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(file, index) in currentFiles" :key="index" style="height: 35px;">
             <td>
               <span
                 :class="{ 'folder-name': file.directory }"
                 @click="handleFileClick(file)"
                 :style="{ cursor: file.directory ? 'pointer' : 'default' }"
               >
                 <i v-if="file.directory" class="iconfont icon-folder"></i>
                 {{ file.name }}
               </span>
             </td>
             <td><span>{{ formatDate(file.updateDate) }}</span></td>
              <td>
                <u-button
                    type="info"
                    icon="icon-open"
                    :title="$t('dialog.open.open')"
                    @click="openFile(file)"
                    style="border: none">
                </u-button>
                <u-button
                    v-if="!file.directory"
                    type="info"
                    icon="icon-delete"
                    :title="$t('dialog.open.del')"
                    @click="deleteFile(file, index)"
                    style="border: none;color: red">
                </u-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { formatDate } from '@/utils/table.js';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import { loadReportProviders, loadReportProvidersByPath, deleteReportFile } from '@/api/designer';
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from "@/components/button/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { createNavigator, getLibMode } from '@/lib/navigator';
import { LoadingDirective } from '@/components/loading/instance.js';

export default {
  name: 'OpenDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UForm,
    UFormItem
  },
  directives: {
    loading: LoadingDirective
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      providers: [],
      selectedProvider: '',
      reportFilesData: {},
      currentFiles: [],
      currentPath: '',
      pathHistory: [],
      loading: false
    };
  },
  computed: {
    providerOptions() {
      return this.providers.map(provider => ({
        value: provider.prefix,
        label: provider.name
      }));
    },
    canGoBack() {
      return this.pathHistory.length > 0;
    },
    pathSegments() {
      if (!this.currentPath) return [];
      return this.currentPath.split('/').filter(Boolean);
    },
    isLibMode() {
      return getLibMode();
    },
    navigator() {
      return createNavigator(this);
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadProviders();
      }
    }
  },
  methods: {
    loadProviders() {
      const _this = this;
      this.loading = true;

      loadReportProviders()
        .then(providers => {
          _this.providers = providers;

          for (let provider of providers) {
            let { reportFiles, name, prefix } = provider;
            _this.reportFilesData[prefix] = reportFiles;
          }

          if (_this.providers.length > 0) {
            _this.selectedProvider = _this.providers[0].prefix;
            _this.onProviderChange();
          }
        })
        .catch(error => {
          console.error('Error loading providers:', error);
          if (error.msg) {
            showAlert(_this.$t('dialog.save.serverError') + _this.$t('colon') + error.msg, { useHTMLString: true });
          } else {
            showAlert(_this.$t('dialog.open.loadFail'));
          }
        })
        .finally(() => {
          _this.loading = false;
        });
    },
    loadProvidersByPath(path) {
      const _this = this;
      this.loading = true;
      loadReportProvidersByPath(path)
        .then(result => {
          for (let prefix in result) {
            let providerData = result[prefix];
            _this.reportFilesData[`${prefix}:${path}`] = providerData.reportFiles;
          }
          _this.onProviderChange();
        })
        .catch(error => {
          console.error('Error loading providers by path:', error);
          if (error.msg) {
            showAlert(_this.$t('dialog.save.serverError') + _this.$t('colon') + error.msg, { useHTMLString: true });
          } else {
            showAlert(_this.$t('dialog.open.loadFail'));
          }
        })
        .finally(() => {
          _this.loading = false;
        });
    },
    onProviderChange() {
      if (!this.selectedProvider) {
        this.currentFiles = [];
        return;
      }

      const key = this.currentPath ? `${this.selectedProvider}:${this.currentPath}` : this.selectedProvider;
      this.currentFiles = this.reportFilesData[key] || [];
    },
    handleProviderChange() {
      this.currentPath = '';
      this.pathHistory = [];
      this.onProviderChange();
    },
    formatDate(date) {
      return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
    },
    openFile(file) {
      const _this = this;

      if (file.directory) {
        this.pathHistory.push(this.currentPath);
        this.currentPath = file.path;
        this.loadProvidersByPath(this.currentPath);
        return;
      }

      showConfirm(`${this.$t('dialog.open.openConfirm')}[${file.name}]？`).then(function() {
        let fullFile = _this.selectedProvider + encodeURI(encodeURI(file.path || file.name));

        // 先关闭弹窗
        _this.handleClose();

        if (_this.isLibMode) {
          _this.$emit('open-file', fullFile);
          _this.navigator.openDesigner({
            reportPath: fullFile
          }, false);
        } else {
          window.location.replace("?reportPath=" + fullFile);
        }
      });
    },
    handleFileClick(file) {
      if (file.directory) {
        this.openFile(file);
      }
    },
    goBack() {
      if (this.pathHistory.length > 0) {
        this.currentPath = this.pathHistory.pop();
        if (this.currentPath === '') {
          this.onProviderChange();
        } else {
          this.loadProvidersByPath(this.currentPath);
        }
      }
    },
    navigateToPath(index) {
      if (index === -1) {
        this.currentPath = '';
        this.pathHistory = [];
        this.onProviderChange();
        return;
      }
      const segments = this.pathSegments.slice(0, index + 1);
      const newPath = segments.join('/');
      if (newPath !== this.currentPath) {
        this.currentPath = newPath;
        this.pathHistory = [];
        this.loadProvidersByPath(this.currentPath);
      }
    },
    deleteFile(file, index) {
      const _this = this;
      showConfirm(`${this.$t('dialog.open.delConfirm')}` + file.name).then(function() {
        let fullFile = _this.selectedProvider + (file.path || file.name);

        deleteReportFile(fullFile)
            .then(() => {
              _this.currentFiles.splice(index, 1);

              let reportFiles = _this.reportFilesData[_this.selectedProvider];
              if (reportFiles) {
                let dataIndex = reportFiles.indexOf(file);
                if (dataIndex > -1) {
                  reportFiles.splice(dataIndex, 1);
                }
              }
            })
            .catch(error => {
              console.error('Error deleting file:', error);
              if (error.msg) {
                showAlert(_this.$t('dialog.save.serverError') + _this.$t('colon') + error.msg, { useHTMLString: true });
              } else {
                showAlert(_this.$t('dialog.open.delFail'));
              }
            });
      });
    },
    handleClose() {
      this.$emit('update:visible', false);
      this.currentPath = '';
      this.pathHistory = [];
    }
  }
};
</script>

<style scoped>
.open-dialog-content {
  padding: 15px;
}
.file-list-container {
  height: 300px;
  overflow-y: auto;
}
.folder-name {
  color: #008ed3;
  font-weight: bold;
  cursor: pointer;
}
.folder-name:hover {
  text-decoration: underline;
}
.icon-folder {
  margin-right: 5px;
  color: #ffc107;
}
</style>
