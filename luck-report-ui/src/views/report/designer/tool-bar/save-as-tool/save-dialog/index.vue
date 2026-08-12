<template>
  <UDialog
    :title="$t('dialog.save.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="save-dialog-content">
      <u-form :label-width="90" label-position="left">
        <u-form-item :label="$t('dialog.save.fileName')" class="property-label">
          <u-input
            v-model="fileName"
            ref="fileNameInput"
            style="width: 340px"
          />
        </u-form-item>

        <u-form-item :label="$t('dialog.save.source')" class="property-label">
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
              <th><span>{{ $t('dialog.save.fileName') }}</span></th>
              <th style="width:200px;"><span>{{ $t('dialog.save.modDate') }}</span></th>
              <th style="width:50px;"><span>{{ $t('dialog.save.operator') }}</span></th>
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
              <td class="table-container-btn" >
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
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { mapGetters } from 'vuex';
import { LoadingDirective } from '@/components/loading/instance.js';

export default {
  name: 'SaveDialog',
  components: {
    UButton,
    UDialog,
    USelect,
    UOption,
    UInput,
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
      fileName: '',
      selectedProvider: '',
      providers: [],
      reportFilesData: {},
      currentReportFiles: [],
      currentProviderPrefix: '',
      currentPath: '',
      pathHistory: [],
      loading: false
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
    },
    pathSegments() {
      if (!this.currentPath) return [];
      return this.currentPath.split('/').filter(Boolean);
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
      this.loading = true;
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
        })
        .finally(() => {
          this.loading = false;
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
            showAlert(_this.$t('dialog.save.serverError') + _this.$t('colon') + error.msg,  { useHTMLString: true });
          } else {
            showAlert(_this.$t('dialog.save.loadFail'));
          }
        })
        .finally(() => {
          _this.loading = false;
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
            that.$store.dispatch('report/setIsSaved', true);
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
