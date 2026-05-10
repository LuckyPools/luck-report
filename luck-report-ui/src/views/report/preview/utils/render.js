
/**
 * 构建URL查询参数字符串
 * 解析当前页面 URL 的查询参数，合并搜索表单参数，生成完整的查询字符串
 * @param {Object} searchFormParameters - 搜索表单参数对象，键值对形式
 * @returns {string} 以 '?' 开头的完整查询参数字符串
 */
export function buildLocationSearchParameters(searchFormParameters) {
  let urlParameters = window.location.search;
  if (urlParameters.length > 0) {
    urlParameters = urlParameters.substring(1, urlParameters.length);
  }
  let parameters = {};
  const pairs = urlParameters.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const item = pairs[i];
    if (item === '') {
      continue;
    }
    const param = item.split('=');
    parameters[param[0]] = param[1];
  }
  if (searchFormParameters) {
    for (let key in searchFormParameters) {
      const value = searchFormParameters[key];
      if (value) {
        parameters[key] = value;
      }
    }
  }
  let p = '?';
  for (let key in parameters) {
    if (p === '?') {
      p += key + '=' + parameters[key];
    } else {
      p += '&' + key + '=' + parameters[key];
    }
  }
  return p;
}

import Vue from 'vue';
import UCheckbox from "@/components/checkbox/index.vue";
import UCheckboxGroup from "@/components/checkbox-group/index.vue";
import USelect from "@/components/select/index.vue";
import UOption from "@/components/option/index.vue";
import URadioGroup from "@/components/radio-group/index.vue";
import URadio from "@/components/radio/index.vue";
import USwitch from "@/components/switch/index.vue";
import UInput from "@/components/input/index.vue";
import UInputNumber from "@/components/input-number/index.vue";
import UButton from "@/components/button/index.vue"
import UDialog from "@/components/dialog/index.vue";
import UFormItem from "@/components/form-item/index.vue";
import UForm from "@/components/form/index.vue";
import URow from "@/components/row/index.vue";
import UCol from "@/components/col/index.vue";
import UDatePicker from "@/components/date-picker/index.vue";
import UTree from "@/components/tree/index.vue";
import UTreeNode from "@/components/tree/tree-node.vue";
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import UButtonGroup from "@/components/button-group/index.vue";
import UColorPicker from "@/components/color-picker/index.vue";
import UDivider from "@/components/divider/index.vue";
import UTag from "@/components/tag/index.vue";
import ULoading from "@/components/loading/index.vue";
import UMessage from "@/components/message/index.vue";
import UMessageBox from "@/components/messagebox/index.vue";


/**
 * 将完整的Vue组件字符串渲染为Vue组件并挂载到指定节点
 * @param {string} componentStr - 完整的Vue组件字符串，包含template、script和style部分
 * @param {HTMLElement|string} mountNode - 挂载节点，可以是DOM元素或选择器字符串
 * @param {Vue} parentInstance - 父组件实例，用于事件通信
 * @returns {Vue} 返回创建的Vue实例
 */
export function renderTemplateToComponent(componentStr, mountNode) {
  // 如果mountNode是字符串，则使用querySelector获取DOM元素
  let node = mountNode;
  if (typeof mountNode === 'string') {
    node = document.querySelector(mountNode);
    if (!node) {
      console.error(`找不到挂载节点: ${mountNode}`);
      return null;
    }
  }

  // 解析组件字符串
  const templateMatch = componentStr.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const scriptMatch = componentStr.match(/<script[^>]*>([\s\S]*?)<\/script>/);

  if (!templateMatch) {
    console.error('组件字符串中未找到template部分');
    return null;
  }

  // 提取模板内容
  const template = templateMatch[1].trim();

  // 默认组件配置，包含所有需要的组件
  const componentOptions = {
    template,
    components: {
      UDialog,
      USwitch,
      URadioGroup,
      USelect,
      UOption,
      UCheckbox,
      UCheckboxGroup,
      URadio,
      UInput,
      UInputNumber,
      UButton,
      UFormItem,
      UForm,
      URow,
      UCol,
      UDatePicker,
      UTree,
      UTreeNode,
      UTabs,
      UTabPane,
      UButtonGroup,
      UColorPicker,
      UDivider,
      UTag,
      ULoading,
      UMessage,
      UMessageBox
    }
  };

  // 如果有script部分，则解析并合并到组件配置中
  if (scriptMatch) {
    try {
      // 使用Function构造函数执行script内容，获取组件配置对象
      const scriptContent = scriptMatch[1].trim();

      // 移除import语句和export default
      const cleanedScript = scriptContent
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
        .replace(/export\s+default\s+/, '');

      // 使用Function构造函数执行脚本，并传入组件作为参数
      const importFunction = new Function(
        'UDialog', 'USwitch', 'URadioGroup', 'USelect', 'UOption', 'UCheckbox',
        'UCheckboxGroup', 'URadio', 'UInput', 'UInputNumber', 'UButton', 'UFormItem',
        'UForm', 'URow', 'UCol', 'UDatePicker', 'UTree', 'UTreeNode', 'UTabs',
        'UTabPane', 'UButtonGroup', 'UColorPicker', 'UDivider', 'UTag', 'ULoading',
        'UMessage', 'UMessageBox',
        `return ${cleanedScript}`
      );

      const scriptResult = importFunction(
        UDialog, USwitch, URadioGroup, USelect, UOption, UCheckbox,
        UCheckboxGroup, URadio, UInput, UInputNumber, UButton, UFormItem,
        UForm, URow, UCol, UDatePicker, UTree, UTreeNode, UTabs,
        UTabPane, UButtonGroup, UColorPicker, UDivider, UTag, ULoading,
        UMessage, UMessageBox
      );

      // 深度合并data函数
      if (scriptResult.data && typeof scriptResult.data === 'function') {
        const originalData = componentOptions.data || (() => ({}));
        componentOptions.data = function() {
          return Object.assign({}, originalData.call(this), scriptResult.data.call(this));
        };
      }

      // 合并methods
      if (scriptResult.methods) {
        componentOptions.methods = Object.assign({}, componentOptions.methods || {}, scriptResult.methods);
      }

      // 合并其他属性（除了data、methods、components）
      for (const key in scriptResult) {
        if (!['data', 'methods', 'components'].includes(key)) {
          componentOptions[key] = scriptResult[key];
        }
      }

    } catch (error) {
      console.error('解析组件script部分时出错:', error);
    }
  }

  const vm = new Vue(componentOptions).$mount();
  if (node) {
    node.innerHTML = '';
    node.appendChild(vm.$el);
  }
  return vm;
}


/**
 * 简化对象结构
 * 将包含 { value: xxx } 单属性的对象递归扁平化为直接值，
 * 处理数组中同类结构的元素，空对象转为空字符串
 * @param {*} obj - 待简化的值，可以是对象、数组或基本类型
 * @returns {*} 简化后的值
 */
export function simplifyObject (obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => simplifyObject(item));
  }

  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        if (value.hasOwnProperty('value') && Object.keys(value).length === 1) {
          result[key] = value.value;
        }
        else if (Array.isArray(value) && value.length > 0 &&
            value.every(item => typeof item === 'object' &&
                item !== null &&
                item.hasOwnProperty('value') &&
                Object.keys(item).length === 1)) {
          result[key] = value.map(item => simplifyObject(item.value));
        } else if (Array.isArray(value)) {
          result[key] = value.map(item => simplifyObject(item));
        } else if (Object.keys(value).length === 0) {
          result[key] = '';
        } else {
          result[key] = simplifyObject(value);
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
