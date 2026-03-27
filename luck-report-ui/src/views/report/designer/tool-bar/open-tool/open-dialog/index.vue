<template>
  <UDialog
    :title="$t('dialog.open.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="open-dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.open.source') }}：</label>
        <div class="u-inline">
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
        </div>
      </div>

      <div class="path-bar" v-if="currentPath || canGoBack">
        <div class="path-display">
          <span class="path-label">{{ $t('dialog.save.currentPath') }}</span>
          <span class="path-text">{{ currentPath || '/' }}</span>
        </div>
        <u-button
          v-if="canGoBack"
          @click="goBack"
          type="primary"
          size="small"
          icon="icon-left"
        >
          {{ $t('dialog.save.backToParent') }}
        </u-button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr class="data-table-header">
              <td><span>{{ $t('dialog.open.fileName') }}</span></td>
              <td style="width:200px;"><span>{{ $t('dialog.open.modDate') }}</span></td>
              <td style="width:50px;"><span>{{ $t('dialog.open.open') }}</span></td>
              <td style="width:50px;"><span>{{ $t('dialog.open.del') }}</span></td>
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
              <td class="data-table-btn">
                <a @click.stop="openFile(file)">
                  <i :class="file.directory ? 'iconfont icon-folder-open' : 'iconfont icon-open'" class="open-button"></i>
                </a>
              </td>
              <td class="data-table-btn" v-if="!file.directory">
                <a @click.stop="deleteFile(file, index)">
                  <i class="iconfont icon-delete del-button"></i>
                </a>
              </td>
              <td v-else></td>
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

export default {
  name: 'OpenDialog',
  components: {
    UButton,
    UDialog,
    USelect,
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
      providers: [],
      selectedProvider: '',
      reportFilesData: {},
      currentFiles: [],
      currentPath: '',
      pathHistory: []
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
            showAlert(_this.$t('dialog.save.serverError') + error.msg);
          } else {
            showAlert(_this.$t('dialog.open.loadFail'));
          }
        });
    },
    loadProvidersByPath(path) {
      const _this = this;
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
            showAlert(_this.$t('dialog.save.serverError') + error.msg);
          } else {
            showAlert(_this.$t('dialog.open.loadFail'));
          }
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
        const routeData = _this.$router.resolve({
          name: 'Designer',
        });
        let path = routeData.href + "?reportPath=" + fullFile;
        window.open(path, "_self");
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
                showAlert(_this.$t('dialog.save.serverError') + error.msg);
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
.form-group {
  margin-bottom: 15px;
}
.path-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  border-radius: 4px;
}
.path-display {
  display: flex;
  align-items: center;
}
.path-label {
  font-weight: bold;
  margin-right: 8px;
  color: #333;
}
.path-text {
  color: #666;
  font-family: monospace;
}
.table-container {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.data-table-header {
  background: #f4f4f4;
  height: 30px;
  position: sticky;
  top: 0;
  z-index: 10;
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
.icon-folder-open {
  margin-right: 5px;
  color: #ffc107;
}
.open-button{
  color: #008ed3;
  font-size: 14pt;
}
.del-button{
  color: red;
  font-size: 14pt;
  cursor: pointer
}
</style>
