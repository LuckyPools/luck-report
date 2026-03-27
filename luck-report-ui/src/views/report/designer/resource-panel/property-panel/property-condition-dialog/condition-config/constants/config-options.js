import {$t} from "@/locales";

export default {
  getFontOptions(t) {
    return [
      { value: "宋体", label: "宋体" },
      { value: "仿宋", label: "仿宋" },
      { value: "黑体", label: "黑体" },
      { value: "楷体", label: "楷体" },
      { value: "微软雅黑", label: "微软雅黑" },
      { value: "Arial", label: "Arial" },
      { value: "Impact", label: "Impact" },
      { value: "Times New Roman", label: "Times New Roman" },
      { value: "Comic Sans MS", label: "Comic Sans MS" },
      { value: "Courier New", label: "Courier New" }
    ];
  },

  getFontSizeOptions() {
    return Array.from({ length: 100 }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString()
    }));
  },

  getYesNoOptions(t) {
    return [
      { value: "true", label: $t('dialog.propCondition.yes') },
      { value: "false", label: $t('dialog.propCondition.no') }
    ];
  },

  getAlignOptions(t) {
    return [
      { value: "left", label: $t('dialog.propCondition.left') },
      { value: "center", label: $t('dialog.propCondition.center') },
      { value: "right", label: $t('dialog.propCondition.right') }
    ];
  },

  getValignOptions(t) {
    return [
      { value: "top", label: $t('dialog.propCondition.top') },
      { value: "middle", label: $t('dialog.propCondition.mid') },
      { value: "bottom", label: $t('dialog.propCondition.bottom') }
    ];
  },

  getScopeOptions(t) {
    return [
      { value: 'cell', label: $t('dialog.propCondition.currentCell') },
      { value: 'row', label: $t('dialog.propCondition.currentRow') },
      { value: 'column', label: $t('dialog.propCondition.currentCol') }
    ];
  },

  getPagingPositionOptions(t) {
    return [
      { value: 'before', label: $t('dialog.propCondition.rowBefore') },
      { value: 'after', label: $t('dialog.propCondition.rowAfter') }
    ];
  },

  getLinkTargetOptions(t) {
    return [
      { value: '_blank', label: $t('dialog.propCondition.newWindow') },
      { value: '_self', label: $t('dialog.propCondition.currentWindow') },
      { value: '_parent', label: $t('dialog.propCondition.parentWindow') },
      { value: '_top', label: $t('dialog.propCondition.topWindow') }
    ];
  },

  getPresetColors() {
    return [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
      '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080',
      '#800000', '#808000', '#008000', '#800080', '#008080',
      '#000080', '#FFA500', '#FFC0CB', '#A52A2A', '#4B0082'
    ];
  },

  getSuggestionList() {
    return [
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
    ];
  }
};
