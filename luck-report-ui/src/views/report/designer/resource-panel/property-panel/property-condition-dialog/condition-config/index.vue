<template>
  <div>
    <!-- 前景色配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="forceChecked" @change="onForceChange">
          {{ $t('dialog.propCondition.forecolor') }}
        </u-checkbox>
      </div>

      <span v-show="forceChecked">
        <div class="u-inline">
          <UColorPicker
              v-model="forceColor"
              @input="onForceColorChange"
          />
        </div>

        <span>{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="forceScope"
              :clearable="true"
              @change="onForceScopeChange"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 背景色配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="bgcolorChecked" @change="onBgcolorChange">
          {{ $t('dialog.propCondition.bgcolor') }}
        </u-checkbox>
      </div>
      <span v-show="bgcolorChecked">
        <div class="u-inline">
          <UColorPicker
              v-model="bgColor"
              @input="onBgColorChange"
          />
        </div>
        <span>{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="bgcolorScope"
              :clearable="true"
              @change="onBgcolorScopeChange"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 字体配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="fontChecked" @change="onFontChange">
          {{ $t('dialog.propCondition.font') }}
        </u-checkbox>
      </div>
      <span v-show="fontChecked" style="margin-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="fontFamily"
              :clearable="true"
              @change="onFontFamilyChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in fontOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="fontFamilyScope"
              :clearable="true"
              @change="onFontFamilyScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 字体大小配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="fontSizeChecked" @change="onFontSizeChange">
          {{ $t('dialog.propCondition.fontSize') }}
        </u-checkbox>
      </div>
      <span v-show="fontSizeChecked" style="padding-left: 10px;">
        <div class="u-inline">
          <u-select
              v-model="fontSize"
              :clearable="true"
              @change="onFontSizeValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in fontSizeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="fontSizeScope"
              :clearable="true"
              @change="onFontSizeScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 粗体配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="fontBoldChecked" @change="onFontBoldChange">
          {{ $t('dialog.propCondition.bold') }}
        </u-checkbox>
      </div>
      <span v-show="fontBoldChecked" style="padding-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="fontBold"
              :clearable="true"
              @change="onFontBoldValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in yesNoOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="fontBoldScope"
              :clearable="true"
              @change="onFontBoldScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 斜体配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="fontItalicChecked" @change="onFontItalicChange">
          {{ $t('dialog.propCondition.italic') }}
        </u-checkbox>
      </div>
      <span v-show="fontItalicChecked" style="padding-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="fontItalic"
              :clearable="true"
              @change="onFontItalicValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in yesNoOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="fontItalicScope"
              :clearable="true"
              @change="onFontItalicScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 下划线配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="fontUnderlineChecked" @change="onFontUnderlineChange">
          {{ $t('dialog.propCondition.underline') }}
        </u-checkbox>
      </div>
      <span v-show="fontUnderlineChecked" style="padding-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="fontUnderline"
              :clearable="true"
              @change="onFontUnderlineValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in yesNoOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="fontUnderlineScope"
              :clearable="true"
              @change="onFontUnderlineScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 水平对齐配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="alignChecked" @change="onAlignChange">
          {{ $t('dialog.propCondition.align') }}
        </u-checkbox>
      </div>
      <span v-show="alignChecked" style="margin-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="align"
              :clearable="true"
              @change="onAlignValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in alignOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="alignScope"
              :clearable="true"
              @change="onAlignScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 垂直对齐配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="valignChecked" @change="onValignChange">
          {{ $t('dialog.propCondition.valign') }}
        </u-checkbox>
      </div>
      <span v-show="valignChecked" style="margin-left: 10px">
        <div class="u-inline">
          <u-select
              v-model="valign"
              :clearable="true"
              @change="onValignValueChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in valignOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <span style="margin-left: 15px;">{{ $t('dialog.propCondition.scope') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="valignScope"
              :clearable="true"
              @change="onValignScopeChange"
              style="width: 120px"
          >
            <u-option
                v-for="option in scopeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
      </span>
    </div>

    <!-- 边框配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="borderChecked" @change="onBorderChange">
          {{ $t('dialog.propCondition.border') }}
        </u-checkbox>
      </div>
      <span v-show="borderChecked" style="margin-left: 10px;">
        <u-button @click="configBorder">
          <i class="iconfont icon-setting"></i> {{ $t('dialog.propCondition.borderConfig') }}
        </u-button>
      </span>
    </div>

    <!-- 新值配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="newValueChecked" @change="onNewValueChange">
          {{ $t('dialog.propCondition.newValue') }}
        </u-checkbox>
      </div>
      <span v-show="newValueChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input
              v-model="newValue"
              :placeholder="$t('dialog.propCondition.newValuePlaceholder')"
              style="width: 268px;"
              @change="onNewValueChange"
          />
        </div>
      </span>
    </div>

    <!-- 格式配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="formatChecked" @change="onFormatChange">
          {{ $t('dialog.propCondition.format') }}
        </u-checkbox>
      </div>
      <span v-show="formatChecked" style="margin-left: 10px;">
         <vue-simple-suggest
             v-model="format"
             :list="suggestionList"
             :filter-by-query="true"
             class="simple-suggest"
             style="display: inline-block"
             @input="onFormatChange"
         ></vue-simple-suggest>
      </span>
    </div>

    <!-- 行高配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="rowHeightChecked" @change="onRowHeightChange">
          {{ $t('dialog.propCondition.rowHeight') }}
        </u-checkbox>
      </div>
      <span v-show="rowHeightChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input-number v-model="rowHeight" @change="onRowHeightChange">
          </u-input-number>
        </div>
      </span>
    </div>

    <!-- 列宽配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="colWidthChecked" @change="onColWidthChange">
          {{ $t('dialog.propCondition.colWidth') }}
        </u-checkbox>
      </div>
      <span v-show="colWidthChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input-number v-model="colWidth" @change="onColWidthChange">
          </u-input-number>
        </div>
      </span>
    </div>

    <!-- 分页配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="pagingBreakChecked" @change="onPagingBreakChange">
          {{ $t('dialog.propCondition.paging') }}
        </u-checkbox>
      </div>
      <span v-show="pagingBreakChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-select
              v-model="pagingPosition"
              :clearable="true"
              @change="onPagingPositionChange"
          >
            <u-option
                v-for="option in pagingPositionOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </div>
        <div class="u-inline" style="margin-left: 10px">
          <u-input-number v-model="pagingLine" @change="onPagingLineChange">
          </u-input-number>
        </div>
      </span>
    </div>

    <!-- 链接配置 -->
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="linkChecked" @change="onLinkChange">
          {{ $t('dialog.propCondition.link') }}
        </u-checkbox>
      </div>
      <span v-show="linkChecked" style="margin-left: 10px">
          <div class="u-inline">
            <u-input
                v-model="linkUrl"
                :placeholder="$t('dialog.propCondition.linkUrlPlaceholder')"
                @change="onLinkUrlChange" />
          </div>
      </span>
      <div v-show="linkChecked" style="margin-left: 10px;margin-top: 5px">
        <span>{{ $t('dialog.propCondition.target') }}</span>
        <div class="u-inline" style="margin-left: 10px">
          <u-select
              v-model="linkTargetWindow"
              :clearable="true"
              @change="onLinkTargetChange"
          >
            <u-option
                v-for="option in linkTargetOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>

          <u-button @click="configLinkParameter" style="margin-left: 5px">
              {{ $t('dialog.propCondition.urlParameter') }}
          </u-button>
        </div>
      </div>
    </div>

    <!-- 对话框组件 -->
    <ConditionParameterCustomBorderDialog
      :visible="customBorderDialogVisible"
      :cell-style="localItem.cellStyle"
      @update:visible="customBorderDialogVisible = $event"
      @save="handleCustomBorderSave"
    />
    <URLParameterDialog
      :visible="urlParameterDialogVisible"
      :parameters="localItem.linkParameters || []"
      @update:visible="handleUrlParameterDialogClose"
      @saveAfter="handleUrlParameterSaveAfter"
      @parameters-change="localItem.linkParameters = $event"
    />
  </div>
</template>

<script>
import ConditionParameterCustomBorderDialog from '../custom-border-dialog/index.vue';
import URLParameterDialog from '../../url-parameter-dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import UButton from '@/components/button/index.vue';
import UColorPicker from '@/components/color-picker/index.vue';
import { showAlert } from '@/utils/comnon.js';
import VueSimpleSuggest from 'vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'
export default {
  name: 'ConditionConfig',
  components: {
    ConditionParameterCustomBorderDialog,
    URLParameterDialog,
    USelect,
    UOption,
    UInputNumber,
    UInput,
    UCheckbox,
    UButton,
    UColorPicker,
    VueSimpleSuggest
  },
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // 创建item的本地副本，避免直接修改props
      localItem: {
        cellStyle: null,
        rowHeight: null,
        colWidth: null,
        newValue: null,
        linkUrl: null,
        linkTargetWindow: null,
        linkParameters: null,
        paging: null,
        name: null
      },

      // 字体列表
      fonts: [
        "宋体", "仿宋", "黑体", "楷体", "微软雅黑", "Arial", "Impact",
        "Times New Roman", "Comic Sans MS", "Courier New", ""
      ],

      // 字体选项
      fontOptions: [],

      // 字体大小选项
      fontSizeOptions: [],

      // 是否选项
      yesNoOptions: [],

      // 水平对齐选项
      alignOptions: [],

      // 垂直对齐选项
      valignOptions: [],

      // 作用域选项
      scopeOptions: [],

      // 分页位置选项
      pagingPositionOptions: [],

      // 链接目标窗口选项
      linkTargetOptions: [],

      // 前景色
      forceChecked: false,
      forceColor: '#000000',
      forceScope: 'cell',

      // 背景色
      bgcolorChecked: false,
      bgColor: '#FFFFFF',
      bgcolorScope: 'cell',

      // 字体
      fontChecked: false,
      fontFamily: '',
      fontFamilyScope: 'cell',

      // 字体大小
      fontSizeChecked: false,
      fontSize: '',
      fontSizeScope: 'cell',

      // 粗体
      fontBoldChecked: false,
      fontBold: '',
      fontBoldScope: 'cell',

      // 斜体
      fontItalicChecked: false,
      fontItalic: '',
      fontItalicScope: 'cell',

      // 下划线
      fontUnderlineChecked: false,
      fontUnderline: '',
      fontUnderlineScope: 'cell',

      // 水平对齐
      alignChecked: false,
      align: '',
      alignScope: 'cell',

      // 垂直对齐
      valignChecked: false,
      valign: '',
      valignScope: 'cell',

      // 边框
      borderChecked: false,

      // 新值
      newValueChecked: false,
      newValue: '',

      // 格式
      formatChecked: false,
      format: '',

      // 行高
      rowHeightChecked: false,
      rowHeight: '',

      // 列宽
      colWidthChecked: false,
      colWidth: '',

      // 分页
      pagingBreakChecked: false,
      pagingPosition: 'after',
      pagingLine: 0,

      // 链接
      linkChecked: false,
      linkUrl: '',
      linkTargetWindow: '',

      // 预设颜色
      presetColors: [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080',
        '#800000', '#808000', '#008000', '#800080', '#008080',
        '#000080', '#FFA500', '#FFC0CB', '#A52A2A', '#4B0082'
      ],

      suggestionList: [
        "yyyy/MM/dd",
        "yyyy/MM",
        "yyyy-MM",
        "yyyy",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy年MM月dd日 HH:mm:ss",
        "yyyy-MM-dd",
        "yyyy年MM月dd日",
        "HH:mm",
        "HH:mm:ss",
        "#.##",
        "#.00",
        "##.##%",
        "##.00%",
        "##,###.##",
        "￥##,###.##",
        "$##,###.##",
        "0.00E00",
        "##0.0E0"
      ],

      urlParameterDialogVisible: false,
      customBorderDialogVisible: false
    };
  },
  created() {
    // 初始化选项数据
    this.initOptions();
  },
  watch: {
    item: {
      handler(newVal) {
        this.updateConfig(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {

    updateConfig(config){
      if (!config) {
        this.localItem = {
          cellStyle: {},
          rowHeight: null,
          colWidth: null,
          newValue: null,
          linkUrl: null,
          linkTargetWindow: null,
          linkParameters: null,
          paging: null,
          name: null
        };
      } else {
        const tempItem = JSON.parse(JSON.stringify(config));

        this.localItem = {
          cellStyle: tempItem.cellStyle || {},
          rowHeight: tempItem.rowHeight !== undefined ? tempItem.rowHeight : null,
          colWidth: tempItem.colWidth !== undefined ? tempItem.colWidth : null,
          newValue: tempItem.newValue !== undefined ? tempItem.newValue : null,
          linkUrl: tempItem.linkUrl !== undefined ? tempItem.linkUrl : null,
          linkTargetWindow: tempItem.linkTargetWindow !== undefined ? tempItem.linkTargetWindow : null,
          linkParameters: tempItem.linkParameters !== undefined ? tempItem.linkParameters : null,
          paging: tempItem.paging !== undefined ? tempItem.paging : null,
          name: tempItem.name !== undefined ? tempItem.name : null,
        };
      }

      // 加载数据到表单字段
      this.loadItemProperties(this.localItem);
    },

    initOptions() {
      // 字体选项
      this.fontOptions = [
        { value: "宋体", label: "宋体" },
        { value: "仿宋", label: "仿宋" },
        { value: "黑体", label: "黑体" },
        { value: "楷体", label: "楷体" },
        { value: "微软雅黑", label: "微软雅黑" },
        { value: "Arial", label: "Arial" },
        { value: "Impact", label: "Impact" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Comic Sans MS", label: "Comic Sans MS" },
        { value: "Courier New", label: "Courier New" },
      ];

      // 字体大小选项
      this.fontSizeOptions = [
        ...Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))
      ];

      // 是否选项
      this.yesNoOptions = [
        { value: "true", label: this.$t('dialog.propCondition.yes') },
        { value: "false", label: this.$t('dialog.propCondition.no') }
      ];

      // 水平对齐选项
      this.alignOptions = [
        { value: "left", label: this.$t('dialog.propCondition.left') },
        { value: "center", label: this.$t('dialog.propCondition.center') },
        { value: "right", label: this.$t('dialog.propCondition.right') }
      ];

      // 垂直对齐选项
      this.valignOptions = [
        { value: "top", label: this.$t('dialog.propCondition.top') },
        { value: "middle", label: this.$t('dialog.propCondition.mid') },
        { value: "bottom", label: this.$t('dialog.propCondition.bottom') }
      ];

      // 作用域选项
      this.scopeOptions = [
        { value: 'cell', label: this.$t('dialog.propCondition.currentCell') },
        { value: 'row', label: this.$t('dialog.propCondition.currentRow') },
        { value: 'column', label: this.$t('dialog.propCondition.currentCol') }
      ];

      // 分页位置选项
      this.pagingPositionOptions = [
        { value: 'before', label: this.$t('dialog.propCondition.rowBefore') },
        { value: 'after', label: this.$t('dialog.propCondition.rowAfter') }
      ];

      // 链接目标窗口选项
      this.linkTargetOptions = [
        { value: '_blank', label: this.$t('dialog.propCondition.newWindow') },
        { value: '_self', label: this.$t('dialog.propCondition.currentWindow') },
        { value: '_parent', label: this.$t('dialog.propCondition.parentWindow') },
        { value: '_top', label: this.$t('dialog.propCondition.topWindow') }
      ];
    },

    loadItemProperties(item) {
      if (!item) return;

      const cellStyle = item.cellStyle || {};

      // 加载前景色
      this.forceChecked = !!(cellStyle.forecolor && cellStyle.forecolor !== '' );
      if (this.forceChecked) {
        const rgbParts = cellStyle.forecolor.split(',');
        if (rgbParts.length === 3) {
          this.forceColor = this.rgbToHex(parseInt(rgbParts[0]), parseInt(rgbParts[1]), parseInt(rgbParts[2]));
        } else {
          this.forceColor = '#000000';
        }
      } else {
        this.forceColor = '';
      }
      this.forceScope = cellStyle.forecolorScope || 'cell';

      // 加载背景色
      this.bgcolorChecked = !!(cellStyle.bgcolor && cellStyle.bgcolor !== '');
      if (this.bgcolorChecked) {
        const rgbParts = cellStyle.bgcolor.split(',');
        if (rgbParts.length === 3) {
          this.bgColor = this.rgbToHex(parseInt(rgbParts[0]), parseInt(rgbParts[1]), parseInt(rgbParts[2]));
        } else {
          this.bgColor = '#FFFFFF';
        }
      } else {
        this.bgColor = '';
      }
      this.bgcolorScope = cellStyle.bgcolorScope || 'cell';

      // 加载字体
      this.fontChecked = !!(cellStyle.fontFamily && cellStyle.fontFamily !== '0');
      this.fontFamily = this.fontChecked ? cellStyle.fontFamily : '';
      this.fontFamilyScope = cellStyle.fontFamilyScope || 'cell';

      // 加载字体大小
      this.fontSizeChecked = !!(cellStyle.fontSize && cellStyle.fontSize !== '0');
      this.fontSize = this.fontSizeChecked ? cellStyle.fontSize : '';
      this.fontSizeScope = cellStyle.fontSizeScope || 'cell';

      // 加载粗体
      this.fontBoldChecked = !!(cellStyle.bold !== null && cellStyle.bold !== undefined && cellStyle.bold !== '');
      this.fontBold = this.fontBoldChecked ? (cellStyle.bold === true || cellStyle.bold === "true" ? "true" : "false") : '';
      this.fontBoldScope = cellStyle.boldScope || 'cell';

      // 加载斜体
      this.fontItalicChecked = !!(cellStyle.italic !== null && cellStyle.italic !== undefined && cellStyle.italic !== '');
      this.fontItalic = this.fontItalicChecked ? (cellStyle.italic === true || cellStyle.italic === "true" ? "true" : "false") : '';
      this.fontItalicScope = cellStyle.italicScope || 'cell';

      // 加载下划线
      this.fontUnderlineChecked = !!(cellStyle.underline !== null && cellStyle.underline !== undefined && cellStyle.underline !== '');
      this.fontUnderline = this.fontUnderlineChecked ? (cellStyle.underline === true || cellStyle.underline === "true" ? "true" : "false") : '';
      this.fontUnderlineScope = cellStyle.underlineScope || 'cell';

      // 加载水平对齐
      this.alignChecked = !!(cellStyle.align && cellStyle.align !== '');
      this.align = this.alignChecked ? cellStyle.align : '';
      this.alignScope = cellStyle.alignScope || 'cell';

      // 加载垂直对齐
      this.valignChecked = !!(cellStyle.valign && cellStyle.valign !== '');
      this.valign = this.valignChecked ? cellStyle.valign : '';
      this.valignScope = cellStyle.valignScope || 'cell';

      // 加载边框
      this.borderChecked = !!(cellStyle.leftBorder || cellStyle.rightBorder || cellStyle.topBorder || cellStyle.bottomBorder);

      // 加载格式
      this.formatChecked = cellStyle.format != null;
      this.format = this.formatChecked ? cellStyle.format : '';

      // 加载新值
      this.newValueChecked = item.newValue != null;
      this.newValue = this.newValueChecked ? item.newValue : '';

      // 加载行高
      this.rowHeightChecked = !!(item.rowHeight !== null && item.rowHeight !== undefined && item.rowHeight !== -1);
      this.rowHeight = this.rowHeightChecked ? item.rowHeight : '';

      // 加载列宽
      this.colWidthChecked = !!(item.colWidth !== null && item.colWidth !== undefined && item.colWidth !== -1);
      this.colWidth = this.colWidthChecked ? item.colWidth : '';

      // 加载分页
      this.pagingBreakChecked = !!item.paging;
      if (this.pagingBreakChecked) {
        this.pagingPosition = item.paging.position || 'after';
        this.pagingLine = item.paging.line || 0;
      }

      // 加载链接
      this.linkChecked = item.linkUrl != null;
      if (this.linkChecked) {
        this.linkUrl = item.linkUrl || '';
        this.linkTargetWindow = item.linkTargetWindow || '';
      }
    },

    // 将十六进制颜色转换为RGB对象
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    // 将RGB值转换为十六进制颜色
    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    },

    // 前景色相关方法
    onForceChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.forceChecked) {
        this.localItem.cellStyle.forecolorScope = 'cell';
        this.localItem.cellStyle.forecolor = '0,0,0';
        this.forceColor = '#000000';
      } else {
        this.localItem.cellStyle.forecolor = null;
        this.localItem.cellStyle.forecolorScope = null;
        this.forceColor = '';
      }
      this.emitPropertyChange();
    },

    onForceColorChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      let val = this.forceColor;
      // Convert hex to RGB format if needed
      if (val.startsWith('#')) {
        const rgb = this.hexToRgb(val);
        if (rgb) {
          val = `${rgb.r},${rgb.g},${rgb.b}`;
        }
      } else if (val.length > 5 && val.startsWith('rgb')) {
        val = val.substring(4, val.length - 1);
      }
      this.localItem.cellStyle.forecolor = val;
      this.emitPropertyChange();
    },

    onForceScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.forecolorScope = this.forceScope;
      this.emitPropertyChange();
    },

    // 背景色相关方法
    onBgcolorChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.bgcolorChecked) {
        this.localItem.cellStyle.bgcolorScope = 'cell';
        this.localItem.cellStyle.bgcolor = '0,0,0';
        this.bgColor = '#000000';
      } else {
        this.localItem.cellStyle.bgcolor = null;
        this.localItem.cellStyle.bgcolorScope = null;
        this.bgColor = '';
      }
      this.emitPropertyChange();
    },

    onBgColorChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      let val = this.bgColor;
      // Convert hex to RGB format if needed
      if (val.startsWith('#')) {
        const rgb = this.hexToRgb(val);
        if (rgb) {
          val = `${rgb.r},${rgb.g},${rgb.b}`;
        }
      } else if (val.length > 5 && val.startsWith('rgb')) {
        val = val.substring(4, val.length - 1);
      }
      this.localItem.cellStyle.bgcolor = val;
      this.emitPropertyChange();
    },

    onBgcolorScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.bgcolorScope = this.bgcolorScope;
      this.emitPropertyChange();
    },

    // 统一处理属性变更事件
    emitPropertyChange() {
      this.$nextTick(() => {
        this.$emit('property-changed', this.localItem);
      });
    },

    // 字体相关方法
    onFontChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.fontChecked) {
        this.localItem.cellStyle.fontFamilyScope = 'cell';
        this.localItem.cellStyle.fontFamily = '宋体';
      } else {
        this.localItem.cellStyle.fontFamily = null;
        this.localItem.cellStyle.fontFamilyScope = null;
      }
      this.emitPropertyChange();
    },

    onFontFamilyChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.fontFamily = this.fontFamily;
      this.emitPropertyChange();
    },

    onFontFamilyScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.fontFamilyScope = this.fontFamilyScope;
      this.emitPropertyChange();
    },

    // 字体大小相关方法
    onFontSizeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.fontSizeChecked) {
        this.localItem.cellStyle.fontSizeScope = 'cell';
        this.localItem.cellStyle.fontSize = '12';
      } else {
        this.localItem.cellStyle.fontSize = null;
        this.localItem.cellStyle.fontSizeScope = null;
      }
      this.emitPropertyChange();
    },

    onFontSizeValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.fontSize = this.fontSize;
      this.emitPropertyChange();
    },

    onFontSizeScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.fontSizeScope = this.fontSizeScope;
      this.emitPropertyChange();
    },

    // 粗体相关方法
    onFontBoldChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.fontBoldChecked) {
        this.localItem.cellStyle.boldScope = 'cell';
        this.localItem.cellStyle.bold = true;
      } else {
        this.localItem.cellStyle.bold = null;
        this.localItem.cellStyle.boldScope = null;
      }
      this.emitPropertyChange();
    },

    onFontBoldValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.bold = this.fontBold;
      this.emitPropertyChange();
    },

    onFontBoldScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.boldScope = this.fontBoldScope;
      this.emitPropertyChange();
    },

    // 斜体相关方法
    onFontItalicChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }
      if (this.fontItalicChecked) {
        this.localItem.cellStyle.italicScope = 'cell';
        this.localItem.cellStyle.italic = true;
      } else {
        this.localItem.cellStyle.italic = null;
        this.localItem.cellStyle.italicScope = null;
      }
      this.emitPropertyChange();
    },

    onFontItalicValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.italic = this.fontItalic;
      this.emitPropertyChange();
    },

    onFontItalicScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.italicScope = this.fontItalicScope;
      this.emitPropertyChange();
    },

    // 下划线相关方法
    onFontUnderlineChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.fontUnderlineChecked) {
        this.localItem.cellStyle.underlineScope = 'cell';
        this.localItem.cellStyle.underline = true;
      } else {
        this.localItem.cellStyle.underline = null;
        this.localItem.cellStyle.underlineScope = null;
      }
      this.emitPropertyChange();
    },

    onFontUnderlineValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.underline = this.fontUnderline;
      this.emitPropertyChange();
    },

    onFontUnderlineScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.underlineScope = this.fontUnderlineScope;
      this.emitPropertyChange();
    },

    // 水平对齐相关方法
    onAlignChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.alignChecked) {
        this.localItem.cellStyle.alignScope = 'cell';
        this.localItem.cellStyle.align = 'center';
      } else {
        this.localItem.cellStyle.align = null;
        this.localItem.cellStyle.alignScope = null;
      }
      this.emitPropertyChange();
    },

    onAlignValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.align = this.align;
      this.emitPropertyChange();
    },

    onAlignScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.alignScope = this.alignScope;
      this.emitPropertyChange();
    },

    // 垂直对齐相关方法
    onValignChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.valignChecked) {
        this.localItem.cellStyle.valignScope = 'cell';
        this.localItem.cellStyle.valign = 'middle';
      } else {
        this.localItem.cellStyle.valign = null;
        this.localItem.cellStyle.valignScope = null;
      }
      this.emitPropertyChange();
    },

    onValignValueChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.valign = this.valign;
      this.emitPropertyChange();
    },

    onValignScopeChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      this.localItem.cellStyle.valignScope = this.valignScope;
      this.emitPropertyChange();
    },

    // 边框相关方法
    onBorderChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.borderChecked) {
        // 不需要做特殊处理，边框通过configBorder方法配置
        const defaultBorder = {
          color:"#000000",
          style:"solid",
          width:1
        };
        this.localItem.cellStyle.leftBorder = JSON.parse(JSON.stringify(defaultBorder));
        this.localItem.cellStyle.rightBorder = JSON.parse(JSON.stringify(defaultBorder));
        this.localItem.cellStyle.topBorder = JSON.parse(JSON.stringify(defaultBorder));
        this.localItem.cellStyle.bottomBorder = JSON.parse(JSON.stringify(defaultBorder));
      } else {
        this.localItem.cellStyle.leftBorder = null;
        this.localItem.cellStyle.rightBorder = null;
        this.localItem.cellStyle.topBorder = null;
        this.localItem.cellStyle.bottomBorder = null;
      }
      this.emitPropertyChange();
    },

    configBorder() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      const cellStyle = this.localItem.cellStyle;

      if (!cellStyle.leftBorder) {
        cellStyle.leftBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!cellStyle.rightBorder) {
        cellStyle.rightBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!cellStyle.topBorder) {
        cellStyle.topBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!cellStyle.bottomBorder) {
        cellStyle.bottomBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      this.customBorderDialogVisible = true;
      this.emitPropertyChange();
    },

    handleCustomBorderSave(borderData) {
      if (this.localItem.cellStyle) {
        this.localItem.cellStyle.topBorder = borderData.topBorder;
        this.localItem.cellStyle.bottomBorder = borderData.bottomBorder;
        this.localItem.cellStyle.leftBorder = borderData.leftBorder;
        this.localItem.cellStyle.rightBorder = borderData.rightBorder;
      }
    },

    // 新值相关方法
    onNewValueChange() {
      if (this.newValueChecked) {
        this.localItem.newValue = this.newValue || '';
      } else {
        this.localItem.newValue = null;
      }
      this.emitPropertyChange();
    },

    // 格式相关方法
    onFormatChange() {
      if (!this.localItem.cellStyle) {
        this.localItem.cellStyle = {};
      }

      if (this.formatChecked) {
        this.localItem.cellStyle.format = this.format || '';
      } else {
        this.localItem.cellStyle.format = null;
      }
      this.emitPropertyChange();
    },

    // 行高相关方法
    onRowHeightChange() {
      if (this.rowHeightChecked) {
        this.localItem.rowHeight = this.rowHeight || '';
      } else {
        this.localItem.rowHeight = null;
      }
      this.emitPropertyChange();
    },

    // 列宽相关方法
    onColWidthChange() {
      if (this.colWidthChecked) {
        this.localItem.colWidth = this.colWidth || '';
      } else {
        this.localItem.colWidth = null;
      }
      this.emitPropertyChange();
    },

    // 分页相关方法
    onPagingBreakChange() {
      if (this.pagingBreakChecked) {
        this.localItem.paging = { position: this.pagingPosition, line: this.pagingLine };
      } else {
        this.localItem.paging = null;
      }
      this.emitPropertyChange();
    },

    onPagingPositionChange() {
      if (this.localItem.paging) {
        this.localItem.paging.position = this.pagingPosition;
      }
      this.emitPropertyChange();
    },

    onPagingLineChange() {
      if (this.localItem.paging) {
        this.localItem.paging.line = this.pagingLine;
      }
      this.emitPropertyChange();
    },

    // 链接相关方法
    onLinkChange() {
      if (this.linkChecked) {
        this.localItem.linkUrl = '';
        this.localItem.linkTargetWindow = '';
      } else {
        this.localItem.linkUrl = null;
        this.localItem.linkTargetWindow = null;
        this.localItem.linkParameters = null;
      }
      this.emitPropertyChange();
    },

    onLinkUrlChange() {
      this.localItem.linkUrl = this.linkUrl;
      this.emitPropertyChange();
    },

    onLinkTargetChange() {
      this.localItem.linkTargetWindow = this.linkTargetWindow;
      this.emitPropertyChange();
    },

    configLinkParameter() {
      if (!this.localItem.linkUrl) {
        showAlert(this.$t('dialog.propCondition.linkUrl'));
        return;
      }

      if (!this.localItem.linkParameters) {
        this.localItem.linkParameters = [];
      }

      this.urlParameterDialogVisible = true;
      this.emitPropertyChange();
    },

    handleUrlParameterDialogClose() {
      this.urlParameterDialogVisible = false;
      this.emitPropertyChange();
    },

    handleUrlParameterSaveAfter({ paramItem, operation }) {
    }
  }
};
</script>

<style scoped>

.simple-suggest /deep/ .default-input{
  width: 268px !important;
  height: 35px;
}
</style>
