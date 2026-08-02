import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue';
import { setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils';
import { getCell, setCell } from '@/utils/contextActions';

/**
 * 单元格条件属性配置 Mixin
 * 为任意单元格值编辑器提供「配置条件」按钮 + 对话框 + 读写 conditionPropertyItems 的能力。
 * 存储位置：cellDef.conditionPropertyItems（与 dataset/expression 编辑器一致）。
 *
 * 宿主编辑器需：
 *   1. mixins: [conditionPropertyMixin]
 *   2. 模板中放置触发按钮（@click="handleConditionPropertyConfig"）
 *   3. 模板中放置 <PropertyConditionDialog>（组件已由本 mixin 注册）
 *   4. 可选：覆盖 getConditionFields() 返回字段数组（数据集类编辑器）
 */
export default {
  components: { PropertyConditionDialog },
  data() {
    return {
      propertyConditionDialogVisible: false,
      conditionGroups: [],
      // 当前单元格值类型（simple/expression/dataset/image/zxing/slash/chart），
      // 用于条件属性对话框按类型隐藏不适用的样式/行为
      currentCellType: 'simple'
    };
  },
  methods: {
    /**
     * 打开条件配置对话框，载入当前单元格已配置的条件组
     */
    handleConditionPropertyConfig() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) return;
      this.currentCellType = (cellDef.value && cellDef.value.type) || 'simple';
      this.conditionGroups = cellDef.conditionPropertyItems
        ? deepCopy(cellDef.conditionPropertyItems)
        : [];
      this.propertyConditionDialogVisible = true;
    },
    /**
     * 对话框保存回调：写回 conditionPropertyItems（支持多选区域批量写入）
     */
    handlePropertyConditionSave(conditionGroups) {
      for (let i = this.rowIndex; i <= this.row2Index; i++) {
        for (let j = this.colIndex; j <= this.col2Index; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) continue;
          const newCellDef = deepCopy(cellDef);
          newCellDef.conditionPropertyItems = deepCopy(conditionGroups);
          setCell(i, j, newCellDef);
        }
      }
      setDirty();
    },
    /**
     * 传给对话框的 fields。非数据集编辑器返回空数组；
     * 数据集类编辑器（如图表）可覆盖此方法返回真实字段列表。
     */
    getConditionFields() {
      return [];
    }
  }
};
