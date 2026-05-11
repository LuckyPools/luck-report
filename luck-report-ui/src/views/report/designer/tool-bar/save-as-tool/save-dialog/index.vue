<template>
  <UDialog
    :title="$t('dialog.save.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="save-dialog-content">
      <div class="form-group">
        <label>{{ $t('dialog.save.fileName') }}：</label>
        <div class="u-inline">
          <u-input
            v-model="fileName"
            ref="fileNameInput"
            style="width: 480px"
          />
        </div>
      </div>

      <div class="form-group">
        <label>{{ $t('dialog.save.source') }}：</label>
        <div class="u-inline">
          <u-select
            v-model="selectedProvider"
            style="width:450px;"
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
          <span class="path-label">{{ $t('dialog.save.currentPath') }}：</span>
          <span class="path-text">{{ currentPath || '/' }}</span>
        </div>
        <u-button
          v-if="canGoBack"
          @click="goBack"
          type="primary"
          size="small"
        >
          <i class="iconfont icon-back"></i>
          {{ $t('dialog.save.backToParent') }}
        </u-button>
      </div>

      <div class="file-list-container">
        <table class="data-table">
          <thead>
            <tr class="data-table-header">
              <td><span>{{ $t('dialog.save.fileName') }}</span></td>
              <td style="width:200px;"><span>{{ $t('dialog.save.modDate') }}</span></td>
              <td style="width:50px;"><span>{{ $t('dialog.save.del') }}</span></td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(file, index) in currentReportFiles" :key="index" style="height: 35px;">
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
              <td class="data-table-btn" v-if="!file.directory">
                <a @click.prevent="deleteFile(file, index)">
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
      <u-button @click="handleSave">{{ $t('dialog.save.save') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { formatDate, resetDirty, tableToXml } from '@/utils/table.js';
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import { saveReportFile, deleteReportFile, loadReportProviders, loadReportProvidersByPath } from '@/api/designer';
import { showAlert, showConfirm } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";
import UInput from "@/components/input/index.vue";
import { mapGetters } from 'vuex';

export default {
  name: 'SaveDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fileName: '',
      selectedProvider: '',
      providers: [],
      reportFilesData: {},
      currentReportFiles: [],
      currentProviderPrefix: '',
      currentPath: '',
      pathHistory: []
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    // 为USelect组件准备的提供者选项
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
    visible(newVal) {
      if (newVal) {
        this.loadReports();
      }
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
    loadReports() {
      loadReportProviders()
        .then(response => {

          let providers;
          if (response && Array.isArray(response)) {
            // 如果response本身就是数组
            providers = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            providers = response.data;
          } else {
            showAlert(this.$t('dialog.save.loadFail'));
            return;
          }

          if (!Array.isArray(providers)) {
            showAlert(this.$t('dialog.save.loadFail'));
            return;
          }
          this.providers = providers;

          // 初始化报表文件数据
          for (let provider of providers) {
            let { reportFiles, name, prefix } = provider;
            this.reportFilesData[prefix] = reportFiles || [];
          }

          // 默认选择第一个提供者
          if (this.providers.length > 0) {
            this.selectedProvider = this.providers[0].prefix;
            this.onProviderChange();
          }
        })
        .catch(error => {
          if (error.msg) {
            showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
          } else {
            showAlert(this.$t('dialog.save.loadFail'));
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
            showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
          } else {
            showAlert(this.$t('dialog.save.loadFail'));
          }
        });
    },

    onProviderChange() {

      if (!this.selectedProvider || this.selectedProvider === '') {
        this.currentReportFiles = [];
        return;
      }

      const key = this.currentPath ? `${this.selectedProvider}:${this.currentPath}` : this.selectedProvider;
      this.currentReportFiles = this.reportFilesData[key] || [];
      this.currentProviderPrefix = this.selectedProvider;
    },

    // 处理提供者变化的方法
    handleProviderChange() {
      this.currentPath = '';
      this.pathHistory = [];
      this.onProviderChange();
    },

    handleFileClick(file) {
      if (file.directory) {
        this.pathHistory.push(this.currentPath);
        this.currentPath = file.path;
        this.loadProvidersByPath(this.currentPath);
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
      showConfirm(this.$t('dialog.save.delConfirm') + file.name).then(() => {
        const fullFile = this.currentProviderPrefix + (file.path || file.name);

        deleteReportFile(fullFile)
            .then(() => {
              this.currentReportFiles.splice(index, 1);

              // 从数据源中移除
              const reportFiles = this.reportFilesData[this.currentProviderPrefix];
              const dataIndex = reportFiles.findIndex(f => f.name === file.name);
              if (dataIndex > -1) {
                reportFiles.splice(dataIndex, 1);
              }
            })
            .catch(error => {
              console.error('删除文件失败:', error);
              if (error.msg) {
                showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
              } else {
                showAlert(this.$t('dialog.save.delFail'));
              }
            });
      });
    },

    handleSave() {
        if (this.fileName === '') {
          showAlert(this.$t('dialog.save.nameTip'));
          return;
        }

        if (!this.currentProviderPrefix || !this.currentReportFiles) {
          showAlert(this.$t('dialog.save.locationTip'));
          return;
        }

        for (let file of this.currentReportFiles) {
          if (!file.directory) {
            let fileName = file.name;
            let pos = fileName.indexOf(".");
            fileName = fileName.substring(0, pos);
            if (fileName === this.fileName) {
              showAlert(this.$t('dialog.save.file') + '[' + this.fileName + ']' + this.$t('dialog.save.exist'));
              return;
            }
          }
        }

        let filePath = this.currentPath ? this.currentPath + '/' + this.fileName : this.fileName;
        const fullFileName = this.currentProviderPrefix + filePath + ".ureport.xml";
        const content = tableToXml(this.context);
        let that = this;
        saveReportFile(fullFileName, content)
          .then(() => {
            that.$store.dispatch('report/setSaveStatus', true);
            that.$store.dispatch('report/setFileName', fullFileName);
            resetDirty();
            showAlert(this.$t('dialog.save.success')).then(() => {
              that.handleClose();
              that.$emit('saveAfter', fullFileName);
            });
          })
          .catch(error => {
            console.error('保存文件失败:', error);
            if (error.msg) {
              showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
            } else {
              showAlert(this.$t('dialog.save.fail'));
            }
          });
    },

    handleClose() {
      this.$emit('update:visible', false);
      setTimeout(() => {
        this.fileName = '';
        this.selectedProvider = '';
        this.currentReportFiles = [];
        this.content = '';
        this.currentPath = '';
        this.pathHistory = [];
      }, 300);
    },

    // 键盘事件处理
    handleKeydown(e) {
      if (this.visible) {
        if (e.key === 'Escape') {
          this.handleClose();
        }
      }
    },

    // 格式化日期
    formatDate(date) {
      return formatDate(date);
    }
  }
};
</script>

<style scoped>
.save-dialog-content {
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
.file-list-container {
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
.del-button{
  color: red;
  font-size: 14pt;
  cursor: pointer
}
</style>
