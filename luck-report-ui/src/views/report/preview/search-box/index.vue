<template>
  <div class="search-box">
    <div class="tools-content">
      <i class="iconfont icon-search"></i>
      <span class="title">
        {{ $t('preview.searchBox.title') }}
      </span>
    </div>
    <div class="main">
      <div ref="searchForm"></div>
    </div>
  </div>
</template>

<script>
import {renderTemplateToComponent} from "@/views/report/preview/utils/render";
import {beautifierConf, deepClone, toSafeNumber} from "@/views/report/designer/search-form/utils";
import {cssStyle, makeUpHtml, vueScript, vueTemplate} from "@/views/report/designer/search-form/utils/html";
import {makeUpJs} from "@/views/report/designer/search-form/utils/js";
import {makeUpCss} from "@/views/report/designer/search-form/utils/css";
import {loadSearchFormOptions} from "@/api/preview";
import {showAlert} from "@/utils/comnon";
import {$t} from "@/locales";
import beautifier from "js-beautify";

export default {
  name: 'SearchBox',
  props: {
    searchFormConfig: {
      type: Object,
      default: () => null
    },
    // 报表文件路径：选项数据集加载时定位报表定义
    reportPath: {
      type: String,
      default: ''
    },
    // 运行模式：preview 时后端从设计器预览缓存加载报表定义
    mode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      formInstance: null,
      // 最近一次渲染的配置（深拷贝），级联刷新时收集依赖用
      currentConfig: null,
      // init 序号：配置变化后丢弃过期的异步响应
      initSeq: 0,
      // 级联刷新防抖定时器
      refreshTimer: null,
      // 级联刷新期间程序化清空的字段集合：抑制其 watch 触发的重复刷新
      suppressedFields: null
    }
  },
  watch: {
    searchFormConfig: {
      handler(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            this.init(newVal);
          });
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    /**
     * 初始化查询表单：数据集选项注入后再生成挂载
     * @param {Object} searchFormConfig 查询表单配置，不可为空
     */
    async init(searchFormConfig) {
      clearTimeout(this.refreshTimer);
      const seq = ++this.initSeq;
      // 深拷贝：注入选项不污染传入配置，避免触发外部 deep watcher
      const config = deepClone(searchFormConfig);
      this.currentConfig = config;
      try {
        await this.injectDatasetOptions(config);
      } catch (e) {
        // 数据集选项加载失败：不渲染表单，展示错误
        const msg = (e && e.msg) ? e.msg : String(e);
        showAlert($t('preview.error.loadSearchFormFail') + this.$t('colon') + msg, { useHTMLString: true });
        return;
      }
      // 过期响应丢弃：配置已变化时不再挂载
      if (seq !== this.initSeq) return;
      this.mountForm(config);
    },
    /**
     * 生成并挂载查询表单组件，注册提交与级联事件
     * @param {Object} config 已注入选项的表单配置，不可为空
     */
    mountForm(config) {
      if (this.formInstance) {
        this.formInstance.$destroy();
        this.formInstance = null;
      }

      const generateType = 'file';
      const script = vueScript(makeUpJs(config, generateType));
      const html = vueTemplate(makeUpHtml(config, generateType));
      const css = cssStyle(makeUpCss(config));
      const formJs = beautifier.html(html + script + css, beautifierConf.html);

      this.formInstance = renderTemplateToComponent(formJs, this.$refs.searchForm);

      this.formInstance.$on('on-submit', (formData) => {
        const clonedData = deepClone(formData);
        this.$emit('submit', clonedData);
      });
      // 级联字段值变化：刷新依赖它的数据集选项
      this.formInstance.$on('on-field-change', (payload) => this.onFieldChange(payload));
    },
    /**
     * 注入数据集选项：收集数据集来源组件并批量拉取选项写回 options
     * @param {Object} config 表单配置（就地修改 options），不可为空
     */
    async injectDatasetOptions(config) {
      const datasetFields = [];
      this.collectDatasetFields(config.fields, datasetFields);
      if (!datasetFields.length) return;

      // 初始参数用 defaultValue 解析（组件尚未挂载，无运行时表单值）
      const initialValues = {};
      this.collectInitialValues(config.fields, initialValues);

      // 按数据集 key 去重请求：同 key 只发一次
      const reqMap = new Map();
      for (const el of datasetFields) {
        const opt = el.datasetOption;
        const key = `${opt.datasourceName}/${opt.datasetName}`;
        if (!reqMap.has(key)) {
          reqMap.set(key, {
            datasourceName: opt.datasourceName,
            datasetName: opt.datasetName,
            labelField: opt.labelField,
            valueField: opt.valueField,
            parameters: this.buildParameters(el, initialValues)
          });
        }
      }

      let vo = null;
      vo = await loadSearchFormOptions(this.reportPath, this.mode, [...reqMap.values()]);
      for (const el of datasetFields) {
        const opt = el.datasetOption;
        const key = `${opt.datasourceName}/${opt.datasetName}`;
        if (vo && vo.errors && vo.errors[key]) {
          console.warn(`load search form options [${key}] error:`, vo.errors[key]);
        }
        el.options = this.normalizeOptionValues(vo && vo.options && vo.options[key]);
      }
    },
    /**
     * 规范化数据集选项值：value 过 toSafeNumber，与设计器默认值转换规则一致，保证严格相等匹配
     * @param {Array} options 后端返回的选项列表，可为空
     * @return {Array} 规范化后的选项列表，入参为空时返回空数组
     */
    normalizeOptionValues(options) {
      return (options || []).map(opt => ({...opt, value: toSafeNumber(opt.value)}));
    },
    /**
     * 级联字段值变化：防抖后刷新依赖该字段的数据集选项
     * @param {Object} payload {field: 变化字段 vModel, value: 新值}
     */
    onFieldChange(payload) {
      if (!payload || !payload.field) return;
      // 级联刷新中程序化清空触发的变更：本轮拓扑刷新已覆盖，跳过
      if (this.suppressedFields && this.suppressedFields.has(payload.field)) return;
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => {
        this.refreshDependents(payload.field);
      }, 300);
    },
    /**
     * 刷新依赖指定字段的数据集选项：按依赖层级逐层串行刷新
     * @param {String} field 变化的父字段 vModel
     */
    async refreshDependents(field) {
      const inst = this.formInstance;
      const config = this.currentConfig;
      if (!inst || !config) return;

      const datasetFields = [];
      this.collectDatasetFields(config.fields, datasetFields);
      // 先拓扑展开全部受影响层级（下一层依赖本层字段，其值已在本层刷新时被清空）
      const layers = [];
      const processed = new Set();
      let layer = datasetFields.filter(el => this.dependsOnField(el, field));
      while (layer.length) {
        const layerFields = [];
        for (const el of layer) {
          if (processed.has(el.vModel)) continue;
          processed.add(el.vModel);
          layerFields.push(el);
        }
        layers.push(layerFields);
        layer = datasetFields.filter(el =>
          !processed.has(el.vModel) && layerFields.some(f => this.dependsOnField(el, f)));
      }
      if (!layers.length) return;

      // 本轮会程序化清空的字段集合：清空值触发的 watch 不再引发二次刷新
      const suppressed = new Set();
      layers.forEach(ls => ls.forEach(el => suppressed.add(el.vModel)));
      this.suppressedFields = suppressed;
      try {
        for (const ls of layers) {
          for (const el of ls) {
            await this.refreshOneField(el, inst);
          }
        }
      } catch (e) {
        // 级联刷新失败：展示错误，中断后续层级刷新
        const msg = (e && e.msg) ? e.msg : String(e);
        showAlert($t('preview.error.loadSearchFormFail') + this.$t('colon') + msg, { useHTMLString: true });
      } finally {
        this.suppressedFields = null;
      }
    },
    /**
     * 刷新单个数据集组件的选项并清空其当前值
     * @param {Object} el 数据集来源组件配置，不可为空
     * @param {Object} inst 查询表单组件实例，不可为空
     */
    async refreshOneField(el, inst) {
      const opt = el.datasetOption;
      const key = `${opt.datasourceName}/${opt.datasetName}`;
      const formData = inst[this.currentConfig.formModel] || {};
      inst.setDsLoading(el.vModel, true);
      try {
        const vo = await loadSearchFormOptions(this.reportPath, this.mode, [{
          datasourceName: opt.datasourceName,
          datasetName: opt.datasetName,
          labelField: opt.labelField,
          valueField: opt.valueField,
          parameters: this.buildParameters(el, formData)
        }]);
        if (vo && vo.errors && vo.errors[key]) {
          console.warn(`load search form options [${key}] error:`, vo.errors[key]);
        }
        inst.updateDsOptions(el.vModel, this.normalizeOptionValues(vo && vo.options && vo.options[key]));
      } finally {
        inst.setDsLoading(el.vModel, false);
      }
      // 旧值可能已不在新选项中，清空子字段当前值
      inst.clearFieldValue(el.vModel, this.getEmptyValue(el));
    },
    /**
     * 递归收集数据集来源的选项组件（含 row children）
     * @param {Array} fields 字段列表，可为空
     * @param {Array} result 收集结果容器，不可为空
     */
    collectDatasetFields(fields, result) {
      for (const el of (fields || [])) {
        if (el.children && Array.isArray(el.children)) {
          this.collectDatasetFields(el.children, result);
          continue;
        }
        if (el.optionSource === 'dataset' && el.datasetOption
          && el.datasetOption.datasourceName && el.datasetOption.datasetName) {
          result.push(el);
        }
      }
    },
    /**
     * 递归收集字段初始值映射（vModel -> defaultValue）
     * @param {Array} fields 字段列表，可为空
     * @param {Object} map 结果容器，不可为空
     */
    collectInitialValues(fields, map) {
      for (const el of (fields || [])) {
        if (el.children && Array.isArray(el.children)) {
          this.collectInitialValues(el.children, map);
          continue;
        }
        if (el.vModel !== undefined) map[el.vModel] = el.defaultValue;
      }
    },
    /**
     * 解析级联查询参数：取父字段当前值，数组拼接为逗号串，空值不传
     * @param {Object} el 数据集来源组件配置，不可为空
     * @param {Object} values 父字段值映射，可为空
     * @return {Object} 数据集查询参数
     */
    buildParameters(el, values) {
      const params = {};
      const bindings = (el.datasetOption && el.datasetOption.datasetParams) || [];
      for (const b of bindings) {
        if (!b.paramKey || !b.parentField) continue;
        const value = this.resolveParamValue(values ? values[b.parentField] : undefined);
        if (value !== undefined) params[b.paramKey] = value;
      }
      return params;
    },
    /**
     * 转换单个参数值：数组按逗号拼接，空值返回 undefined（不传）
     * @param {Any} value 参数值，可为空
     * @return {String|Number|undefined} 可传递的参数值
     */
    resolveParamValue(value) {
      if (value === undefined || value === null || value === '') return undefined;
      if (Array.isArray(value)) return value.length ? value.join(',') : undefined;
      return value;
    },
    /**
     * 判断组件是否级联依赖指定父字段
     * @param {Object} el 数据集来源组件配置，不可为空
     * @param {String} field 父字段 vModel
     * @return {Boolean} 依赖返回 true
     */
    dependsOnField(el, field) {
      const bindings = (el.datasetOption && el.datasetOption.datasetParams) || [];
      return bindings.some(b => b.parentField === field);
    },
    /**
     * 取组件清空值：数组型（checkbox-group / multiple）清为 []，其余清为空串
     * @param {Object} el 组件配置，不可为空
     * @return {Array|String} 清空值
     */
    getEmptyValue(el) {
      if (el.tag === 'u-checkbox-group' || el.multiple) return [];
      return '';
    }
  },
  beforeDestroy() {
    clearTimeout(this.refreshTimer);
    if (this.formInstance) {
      this.formInstance.$destroy();
      this.formInstance = null;
    }
  }
}
</script>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.tools-content {
  border-bottom: solid 1px #ddd;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding: 0 7.5px;
  gap: 6px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
}

.tools-content .iconfont {
  margin-left: 15px;
}

.title {
  font-size: 14px;
}

.main {
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px 20px 10px;
}
</style>
