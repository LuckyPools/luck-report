<template>
  <div class="cell-value-editor">
    <!-- 父单元格配置 -->
    <div v-show="showParentGroup" ref="parentGroup">
      <div class="form-group" style="margin-bottom:6px">
        <label>{{ $t('property.prop.leftParent') }}：</label>
        <div class="u-inline">
          <u-radio-group
              v-model="leftParentType"
              @change="handleLeftParentTypeChange"
          >
            <u-radio
                v-for="option in parentTypeOptions"
                :key="option.value"
                :label="option.value"
            >
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
        <div>
          <div class="u-inline">
            <u-select
                v-model="leftParentCellName"
                :clearable="true"
                :disabled="leftParentType !== 'custom'"
                @change="handleLeftParentCellNameChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in leftParentCellNameOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
          <div class="u-inline">
            <u-select
                v-model="leftParentRowNumber"
                :clearable="true"
                :disabled="leftParentType !== 'custom' || leftParentCellName === 'root'"
                @change="handleLeftParentRowNumberChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in leftParentRowNumberOptionsFormatted"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:6px">
        <label>{{ $t('property.prop.topParent') }}：</label>
        <div class="u-inline">
          <u-radio-group
              v-model="topParentType"
              @change="handleTopParentTypeChange"
          >
            <u-radio
                v-for="option in parentTypeOptions"
                :key="option.value"
                :label="option.value"
            >
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
        <div>
          <div class="u-inline">
            <u-select
                v-model="topParentCellName"
                :disabled="topParentType !== 'custom'"
                :clearable="true"
                @change="handleTopParentCellNameChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in topParentCellNameOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
          <div class="u-inline">
            <u-select
                v-model="topParentRowNumber"
                :clearable="true"
                :disabled="topParentType !== 'custom' || topParentCellName === 'root'"
                @change="handleTopParentRowNumberChange"
                style="margin-left:10px;width: 100px"
            >
              <u-option
                  v-for="option in topParentRowNumberOptionsFormatted"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
              />
            </u-select>
          </div>
        </div>
      </div>
    </div>

    <!-- 渲染器配置 -->
    <div v-show="showRendererGroup" ref="rendererGroup" class="form-group" style="margin-bottom:6px">
      <label>{{ $t('property.prop.renderBean') }}：</label>
      <div class="input-group" style="width: 290px;display: inline-block;height: 22px;">
        <div class="u-inline">
          <u-input
            v-model="rendererBean"
            style="width: 204px"
            @change="handleRendererChange"
          />
        </div>
        <span class="input-group-btn">
          <u-button @click="handleSelectRenderer">
            {{ $t('property.prop.selectBean') }}
          </u-button>
        </span>
      </div>
    </div>

    <!-- 链接配置 -->
    <fieldset v-show="showLinkGroup" ref="linkGroup" class="link-fieldset">
      <legend class="link-legend">
        {{ $t('property.prop.linkConfig') }}
      </legend>
      <div class="form-group" style="margin-bottom:8px">
        <label>URL(<span style="font-size: 12px;color: #747474">{{ $t('property.prop.urlExpressionSupport') }}</span>)：</label>
        <div class="u-inline">
          <u-input
            v-model="linkUrl"
            :placeholder="$t('property.prop.urlExpressionExample')"
            style="width: 360px;"
            @change="handleLinkUrlChange"
          />
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0px">
        <label>{{ $t('property.prop.target') }}：</label>
        <div class="u-inline">
          <u-select
            v-model="linkTarget"
            :clearable="true"
            @change="handleLinkTargetChange"
            style="width: 120px"
          >
            <u-option
              v-for="option in linkTargetOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </div>
        <u-button
          type="primary"
          style="margin-left: 10px;"
          @click="handleUrlParameterConfig"
        >
          {{ $t('property.prop.urlParameterConfig') }}
        </u-button>
      </div>
    </fieldset>

    <!-- 单元格类型 -->
    <div v-show="showTypeGroup" ref="typeGroup" class="form-group" style="margin-bottom:10px;margin-top: 10px;">
      <label>{{ $t('property.prop.cellType') }}：</label>
      <div class="u-inline">
          <u-select
            v-model="cellType"
            :clearable="true"
            @change="handleCellTypeChange"
          >
            <u-option
              v-for="option in cellTypeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </div>
    </div>

    <!-- URL参数对话框 -->
    <URLParameterDialog
      v-show="urlParameterDialogVisible"
      :visible="urlParameterDialogVisible"
      :parameters="linkParameters || []"
      @update:visible="handleUrlParameterDialogClose"
      @parameters-change="handleLinkParametersChange"
    />
  </div>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import { getCell, getCellName, setCell } from "@/utils/contextActions";
import URLParameterDialog from '@/views/report/designer/resource-panel/property-panel/url-parameter-dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInput from '@/components/input/index.vue';
import UButton from '@/components/button/index.vue';
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'CellValueEditor',
  components: {
    URLParameterDialog,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInput,
    UButton
  },
  props: {
    showParentGroup: {
      type: Boolean,
      default: false
    },
    showRendererGroup: {
      type: Boolean,
      default: false
    },
    showLinkGroup: {
      type: Boolean,
      default: false
    },
    showTypeGroup: {
      type: Boolean,
      default: false
    },
    rowIndex: {
      type: Number,
      default: 0
    },
    colIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      urlParameterDialogVisible: false,
      leftParentCellNameOptions: [],
      leftParentRowNumberOptions: [],
      topParentCellNameOptions: [],
      topParentRowNumberOptions: [],
      leftParentType: 'default',
      topParentType: 'default',
      leftParentCellName: '',
      leftParentRowNumber: '',
      topParentCellName: '',
      topParentRowNumber: '',
      rendererBean: '',
      linkUrl: '',
      linkTarget: '_blank',
      cellType: 'simple',
      linkParameters: []
    };
  },
  computed: {
    parentTypeOptions() {
      return [
        { label: this.$t('property.prop.default'), value: 'default' },
        { label: this.$t('property.prop.custom'), value: 'custom' }
      ];
    },
    leftParentRowNumberOptionsFormatted() {
      return this.leftParentRowNumberOptions.map(num => ({
        label: num,
        value: num.toString()
      }));
    },
    topParentRowNumberOptionsFormatted() {
      return this.topParentRowNumberOptions.map(num => ({
        label: num,
        value: num.toString()
      }));
    },
    linkTargetOptions() {
      return [
        { label: this.$t('property.prop.newWindow'), value: '_blank' },
        { label: this.$t('property.prop.currentWindow'), value: '_self' },
        { label: this.$t('property.prop.parentWindow'), value: '_parent' },
        { label: this.$t('property.prop.topWindow'), value: '_top' }
      ];
    },
    cellTypeOptions() {
      return [
        { label: this.$t('property.prop.text'), value: 'simple' },
        { label: this.$t('property.prop.expr'), value: 'expression' },
        { label: this.$t('property.prop.dataset'), value: 'dataset' },
        { label: this.$t('property.prop.image'), value: 'image' },
        { label: this.$t('property.prop.slash'), value: 'slash' },
        { label: this.$t('property.prop.qrcode'), value: 'qrcode' },
        { label: this.$t('property.prop.barcode'), value: 'barcode' },
        { label: this.$t('property.prop.chart'), value: 'chart' }
      ];
    }
  },
  watch: {
    rowIndex() {
      this.buildParentCellNameOptions();
      this.buildParentRowNumberOptions();
      this.updateLinkParameters();
    },
    colIndex() {
      this.buildParentCellNameOptions();
      this.buildParentRowNumberOptions();
      this.updateLinkParameters();
    }
  },
  mounted() {
    this.buildParentCellNameOptions();
    this.buildParentRowNumberOptions();
    this.updateLinkParameters();
  },
  methods: {
    updateLinkParameters() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (cellDef && cellDef.linkParameters) {
        this.linkParameters = cellDef.linkParameters;
      } else {
        this.linkParameters = [];
      }
    },
    buildParentCellNameOptions() {
      const hot = TableManager.get();
      const countCols = hot.countCols();
      const cellDef = getCell(this.rowIndex, this.colIndex);

      this.leftParentCellNameOptions = [{ value: 'root', label: this.$t('property.prop.none') }];
      this.topParentCellNameOptions = [{ value: 'root', label: this.$t('property.prop.none') }];

      for (let j = 0; j < countCols; j++) {
        let name = getCellName(null, j);
        this.leftParentCellNameOptions.push({ value: name, label: name });
        this.topParentCellNameOptions.push({ value: name, label: name });
      }

      if (cellDef && cellDef.leftParentCellName) {
        this.leftParentType = 'custom';
        const name = cellDef.leftParentCellName;
        if (name === 'root') {
          this.leftParentCellName = 'root';
          this.leftParentRowNumber = '';
        } else {
          const data = this.parseCellName(name);
          this.leftParentCellName = data.name;
          this.leftParentRowNumber = data.num;
        }
      } else {
        this.leftParentType = 'default';
        if (this.colIndex === 0) {
          this.leftParentCellName = 'root';
          this.leftParentRowNumber = '';
        } else {
          let row = this.rowIndex, col = this.colIndex - 1;
          const hot = TableManager.get();
          const td = hot.getCell(row, col);
          if (this.isCellHidden(td)) {
            const mergeCells = hot.getSettings().mergeCells;
            for (const item of mergeCells) {
              const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan;
              const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1;
              if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
                row = rowStart;
                col = colStart;
                break;
              }
            }
          }
          const cellName = getCellName(row, col);
          const data = this.parseCellName(cellName);
          this.leftParentCellName = data.name;
          this.leftParentRowNumber = data.num;
        }
      }

      if (cellDef && cellDef.topParentCellName) {
        this.topParentType = 'custom';
        const name = cellDef.topParentCellName;
        if (name === 'root') {
          this.topParentCellName = 'root';
          this.topParentRowNumber = '';
        } else {
          const data = this.parseCellName(name);
          this.topParentCellName = data.name;
          this.topParentRowNumber = data.num;
        }
      } else {
        this.topParentType = 'default';
        if (this.rowIndex === 0) {
          this.topParentCellName = 'root';
          this.topParentRowNumber = '';
        } else {
          let row = this.rowIndex - 1, col = this.colIndex;
          const hot = TableManager.get();
          const td = hot.getCell(row, col);
          if (this.isCellHidden(td)) {
            const mergeCells = hot.getSettings().mergeCells;
            for (const item of mergeCells) {
              const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan;
              const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1;
              if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
                row = rowStart;
                col = colStart;
                break;
              }
            }
          }
          const cellName = getCellName(row, col);
          const data = this.parseCellName(cellName);
          this.topParentCellName = data.name;
          this.topParentRowNumber = data.num;
        }
      }

      if (cellDef && cellDef.cellStyle && cellDef.cellStyle.renderer) {
        this.rendererBean = cellDef.cellStyle.renderer;
      } else {
        this.rendererBean = '';
      }

      if (cellDef) {
        this.linkUrl = cellDef.linkUrl || '';
        this.linkTarget = cellDef.linkTargetWindow || '_blank';
      } else {
        this.linkUrl = '';
        this.linkTarget = '_blank';
      }

      if (cellDef && cellDef.value) {
        let type = cellDef.value.type || 'simple';
        if (type === 'zxing') {
          this.cellType = cellDef.value.category;
        } else {
          this.cellType = type;
        }
      } else {
        this.cellType = 'simple';
      }
    },

    buildParentRowNumberOptions() {
      const hot = TableManager.get();
      const countRows = hot.countRows();

      this.leftParentRowNumberOptions = [];
      this.topParentRowNumberOptions = [];

      for (let j = 0; j < countRows; j++) {
        this.leftParentRowNumberOptions.push(j + 1);
        this.topParentRowNumberOptions.push(j + 1);
      }
    },

    handleLeftParentTypeChange(value) {
      if (value === 'default') {
        this.setParentCell(null, true);
      }
    },

    handleLeftParentCellNameChange(value) {
      if (value === 'root') {
        this.setParentCell('root', true);
      } else {
        const num = this.leftParentRowNumber;
        if (value !== '' && num !== '') {
          this.setParentCell(value + num.toString(), true);
        }
      }
    },

    handleLeftParentRowNumberChange(value) {
      const name = this.leftParentCellName;
      if (name === 'root') {
        this.setParentCell('root', true);
      } else {
        if (name !== '' && value !== '') {
          this.setParentCell(name + value.toString(), true);
        }
      }
    },

    handleTopParentTypeChange(value) {
      if (value === 'default') {
        this.setParentCell(null, false);
      }
    },

    handleTopParentCellNameChange(value) {
      if (value === 'root') {
        this.setParentCell('root', false);
      } else {
        const num = this.topParentRowNumber;
        if (value !== '' && num !== '') {
          this.setParentCell(value + num.toString(), false);
        }
      }
    },

    handleTopParentRowNumberChange(value) {
      const name = this.topParentCellName;
      if (name === 'root') {
        this.setParentCell('root', false);
      } else {
        if (name !== '' && value !== '') {
          this.setParentCell(name + value.toString(), false);
        }
      }
    },

    setParentCell(parentCellName, isLeft) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);
      if (isLeft) {
        newCellDef.leftParentCellName = parentCellName;
      } else {
        newCellDef.topParentCellName = parentCellName;
      }
      setCell(this.rowIndex, this.colIndex, newCellDef);
      setDirty();
    },

    isCellHidden(td) {
      return td && td.style && td.style.display === 'none';
    },

    parseCellName(cellName) {
      let pos = -1;
      for (let i = 0; i < cellName.length; i++) {
        const char = cellName.charAt(i);
        const num = parseInt(char);
        if (!isNaN(num)) {
          pos = i;
          break;
        }
      }
      const name = cellName.substring(0, pos);
      const num = cellName.substring(pos, cellName.length);
      return { name, num: num.toString() };
    },

    handleRendererChange(value) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);
      if (!newCellDef.cellStyle) {
        newCellDef.cellStyle = {};
      }
      newCellDef.cellStyle.renderer = value;
      setCell(this.rowIndex, this.colIndex, newCellDef);
      setDirty();
    },

    handleSelectRenderer() {
      this.$emit('select-renderer');
    },

    handleLinkUrlChange(value) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);
      newCellDef.linkUrl = value;
      setCell(this.rowIndex, this.colIndex, newCellDef);
      setDirty();
    },

    handleLinkTargetChange(value) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);
      newCellDef.linkTargetWindow = value;
      setCell(this.rowIndex, this.colIndex, newCellDef);
      setDirty();
    },

    handleUrlParameterConfig() {
      if (!this.linkUrl || this.linkUrl === '') {
        showAlert(this.$t('property.prop.urlTip'));
        return;
      }
      this.urlParameterDialogVisible = true;
    },

    handleUrlParameterDialogClose() {
      this.urlParameterDialogVisible = false;
    },

    handleLinkParametersChange(value) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);
      newCellDef.linkParameters = value || [];
      setCell(this.rowIndex, this.colIndex, newCellDef);
      setDirty();
      this.linkParameters = value || [];
    },

    handleCellTypeChange(value) {
      this.$emit('cell-type-change', value);
    }
  }
};
</script>

<style scoped>
.cell-value-editor {
  width: 100%;
}

.link-fieldset {
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 10px;
  margin-bottom: 10px;
}

.link-legend {
  padding: 0 5px;
  font-size: 12px;
  font-weight: bold;
}
</style>
