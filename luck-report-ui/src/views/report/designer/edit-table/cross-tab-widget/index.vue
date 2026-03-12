<template>
  <div class="cross-tab-container" ref="container"></div>
</template>

<script>
import Raphael from 'raphael';
import saveSvgAsPng from 'save-svg-as-png';
import {getCell, setCell} from "@/utils/contextActions";
import {deepCopy} from "@/components/utils";

export default {
  name: 'CrossTabWidget',
  props: {
    context: {
      type: Object,
      required: true
    },
    rowIndex: {
      type: Number,
      required: true
    },
    colIndex: {
      type: Number,
      required: true
    },
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      slashData: [],
      rowSpan: 1,
      colSpan: 1,
      width: 0,
      height: 0,
      paper: null
    };
  },
  mounted() {
    // 初始化斜线数据
    if (this.value) {
      for (let name of this.value.split('|')) {
        this.slashData.push(name);
      }
    }
    
    // 刷新单元格
    this.refreshCell();
  },
  
  beforeDestroy() {
    // 清理Raphael实例
    if (this.paper) {
      this.paper.remove();
      this.paper = null;
    }
  },
  methods: {
    refreshCell() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      const td = this.getCellElement();
      
      // 获取行合并和列合并属性
      this.rowSpan = parseInt(td.rowSpan) || 1;
      this.colSpan = parseInt(td.colSpan) || 1;
      
      // 计算宽高
      this.width = -2;
      this.height = -4;
      
      const rowStart = this.rowIndex;
      const rowEnd = this.rowIndex + this.rowSpan;
      for (let i = rowStart; i < rowEnd; i++) {
        const rowH = this.hot.getRowHeight(i);
        this.height += rowH;
      }
      
      const colStart = this.colIndex;
      const colEnd = this.colIndex + this.colSpan;
      for (let i = colStart; i < colEnd; i++) {
        const colW = this.hot.getColWidth(i);
        this.width += colW;
      }

      if (!cellDef?.value?.slashes) {
          this._buildSlashes();
          this.doDraw();
      } else {
          this.doDraw();
      }
    },
    
    getCellElement() {
      // 获取单元格DOM元素
      return this.hot.getCell(this.rowIndex, this.colIndex);
    },
    
    _buildSlashes() {
      const colStart = this.colIndex;
      const colEnd = this.colIndex + this.colSpan;
      let colWidth = 0;
      for (let i = colStart; i < colEnd; i++) {
        colWidth += this.hot.getColWidth(i);
      }
      
      let rowHeight = 0;
      const rowStart = this.rowIndex;
      const rowEnd = this.rowIndex + this.rowSpan;
      for (let i = rowStart; i < rowEnd; i++) {
        rowHeight += this.hot.getRowHeight(i);
      }
      
      const dataSize = this.slashData.length;
      let index = 1;
      const slashes = [];
      
      for (let i = 0; i < this.rowSpan; i++) {
        let height = 0;
        for (let j = 0; j < i; j++) {
          height += this.hot.getRowHeight(this.rowIndex + j);
        }
        
        if (i === 0 || i + 1 < this.rowSpan) {
          height += 8;
        } else {
          height -= 3;
        }
        
        let itemName = '项目' + index;
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = this.slashData[index - 1];
        } else if (dataSize > 0 && index - 1 >= dataSize) {
          break;
        }
        
        const degree = this._computeDegree(colWidth, height);
        const width = this.hot.getColWidth(this.colIndex + (this.colSpan - 1));
        const x = parseInt(colWidth - 30);
        
        slashes.push({
          degree,
          x,
          y: height,
          text: itemName
        });
        
        index++;
      }
      
      if (dataSize === 0 || index - 1 < dataSize) {
        let itemName = '项目' + index;
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = this.slashData[index - 1];
        }
        
        const degree = this._computeDegree(colWidth, rowHeight);
        let x = colWidth;
        
        if (this.colSpan > 1) {
          x -= this.hot.getColWidth(this.colIndex + (this.colSpan - 1));
        } else {
          x -= parseInt(x / 5);
        }
        
        let y = rowHeight;
        if (this.rowSpan > 1) {
          y -= parseInt(this.hot.getRowHeight(this.rowIndex + (this.rowSpan - 1)) / 2) + 5;
        } else {
          y -= parseInt(y / 2);
        }
        
        slashes.push({
          degree,
          x,
          y,
          text: itemName
        });
        
        index++;
      }
      
      for (let i = 0; i < this.colSpan; i++) {
        let width = 0;
        for (let j = 0; j < i; j++) {
          width += this.hot.getColWidth(this.colIndex + j);
        }
        
        let itemName = '项目' + index;
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = this.slashData[index - 1];
        } else if (dataSize > 0 && index - 1 >= dataSize) {
          break;
        }
        
        width += 20;
        const degree = this._computeDegree(rowHeight, width);
        const y = rowHeight - 20;
        
        slashes.push({
          degree,
          x: width,
          y,
          text: itemName
        });
        
        index++;
      }
      
      // 更新 cellDef 中的 slashes 数据
      const cellDef = getCell(this.rowIndex, this.colIndex);
      const cellDefCopy = deepCopy(cellDef);
      cellDefCopy.value = {
        slashes,
        type: 'slash'
      };
      setCell(this.rowIndex, this.colIndex, cellDefCopy);
    },
    
    doDraw() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      
      const slashValue = cellDef.value;
      const cellStyle = cellDef.cellStyle;
      
      if (!cellStyle.forecolor) {
        cellStyle.forecolor = '0,0,0';
      }
      
      let index = 0;
      const container = this.$refs.container;
      
      // 保存宽高值，防止被 Raphael 修改
      const savedWidth = this.width;
      const savedHeight = this.height;
      
      // 清空容器
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // 设置容器尺寸，防止被 Raphael 影响
      container.style.width = savedWidth + 'px';
      container.style.height = savedHeight + 'px';
      
      // 创建 Raphael 实例
      this.paper = Raphael(container, savedWidth, savedHeight);
      
      // 设置文字样式
      let fontStyle = cellStyle.fontSize + "pt " + (cellStyle.fontFamily ? cellStyle.fontFamily : "宋体");
      let bold = cellStyle.bold ? 'bold' : 'normal';
      let italic = cellStyle.italic ? 'italic' : 'normal';
      let underline = cellStyle.underline ? 'underline' : 'none';
      
      let textStyle = {
        'fill': this.rgbToHex(cellStyle.forecolor),
        'font': fontStyle,
        'font-weight': bold,
        'font-style': italic,
        'text-decoration': underline
      };
      
      const slashes = slashValue.slashes;
      const size = slashes.length;
      
      // 绘制行斜线
      for (let i = 0; i < (this.rowSpan - 1); i++) {
        if (size > 0 && index >= size) {
          break;
        }

        let h = 0;
        for (let j = 0; j <= i; j++) {
          h += this.hot.getRowHeight(this.rowIndex + j);
        }

        if (size == 2) h = savedHeight;

        if (index < size) {
          this.paper.path("M0 0L" + savedWidth + " " + h).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
        }

        let slash = slashes[index];
        let text = this.paper.text(0, 0, slash.text).attr(textStyle);
        text.attr({
          transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
        });

        index++;
      }
      
      // 绘制主斜线
      if (size === 0 || index < size) {
        let h = savedHeight - (this.hot.getRowHeight(this.rowIndex + (this.rowSpan - 1)))/3;

        if (index + 1 < size) {
          if (size == 2) h = savedHeight;
          this.paper.path("M0 0L" + savedWidth + " " + h).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
        }

        let slash = slashes[index];
        index++;

        let text = this.paper.text(0, 0, slash.text).attr(textStyle);
        text.attr({
          transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
        });

        if (size === 0 || index < size) {
          let w = savedWidth - (this.hot.getColWidth(this.colIndex + (this.colSpan - 1)))/3;

          if (index + 1 < size) {
            if (size == 2) w = savedWidth;
            this.paper.path("M0 0L" + w + " " + savedHeight).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
          }

          slash = slashes[index];
          index++;

          text = this.paper.text(0, 0, slash.text).attr(textStyle);
          text.attr({
            transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
          });
        }
      }
      
      // 绘制列斜线
      for (let i = 0; i < (this.colSpan - 1); i++) {
        if (size > 0 && index >= size) {
          break;
        }

        let w = 0;
        for (let j = 0; j <= i; j++) {
          w += this.hot.getColWidth(this.colIndex + j);
        }

        if (size == 2) w = savedWidth;

        this.paper.path("M0 0L" + w + " " + savedHeight).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });

        let slash = slashes[index];
        index++;

        let text = this.paper.text(0, 0, slash.text).attr(textStyle);
        text.attr({
          transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
        });
      }

      if (size === 0 || index < size) {
        let slash = slashes[index];
        index++;

        let text = this.paper.text(0, 0, slash.text).attr(textStyle);
        text.attr({
          transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
        });
      }

      // 转换为 PNG 并保存 base64 数据
      const svg = container.querySelector('svg');
      if (svg) {
        saveSvgAsPng.svgAsPngUri(svg, { encoderOptions: 1 }, (base64Data) => {
          slashValue.base64Data = base64Data;
        });
      }
    },
    
    _computeDegree(a, b) {
      const c = Math.sqrt(a * a + b * b);
      const sin = Math.sin(b / c);
      const degree = (180 / Math.PI) * Math.asin(sin);
      return parseInt(degree);
    },
    
    rgbToHex(rgb) {
      const rgbArray = rgb.split(',');
      const r = parseInt(rgbArray[0]);
      const g = parseInt(rgbArray[1]);
      const b = parseInt(rgbArray[2]);
      return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    },
    
    componentToHex(c) {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }
  },
  
  computed: {
    hot() {
      return this.context.hot;
    }
  }
};
</script>

<style scoped>
.cross-tab-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
