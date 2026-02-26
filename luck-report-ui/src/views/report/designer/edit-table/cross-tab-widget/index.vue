<template>
  <div class="cross-tab-container" ref="container"></div>
</template>

<script>
import Raphael from 'raphael';
import saveSvgAsPng from 'save-svg-as-png';

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
    cellDef: {
      type: Object,
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
      paper: null,
      // 本地存储的行列索引，避免直接修改props
      localRowIndex: this.rowIndex,
      localColIndex: this.colIndex
    };
  },
  mounted() {
    // 初始化斜线数据
    if (this.value) {
      for (let name of this.value.split('|')) {
        this.slashData.push(name);
      }
    }
    
    // 初始化本地索引
    this.localRowIndex = this.rowIndex;
    this.localColIndex = this.colIndex;
    
    // 刷新单元格
    this.refreshCell(this.cellDef);
  },
  
  // 监听props变化，更新本地数据
  watch: {
    rowIndex(newVal) {
      this.localRowIndex = newVal;
    },
    colIndex(newVal) {
      this.localColIndex = newVal;
    }
  },
  beforeDestroy() {
    // 清理Raphael实例
    if (this.paper) {
      this.paper.remove();
      this.paper = null;
    }
  },
  methods: {
    refreshCell(cellDef) {
      const td = this.getCellElement();
      
      // 获取行合并和列合并属性
      this.rowSpan = parseInt(td.rowSpan) || 1;
      this.colSpan = parseInt(td.colSpan) || 1;
      
      // 计算宽高
      this.width = -2;
      this.height = -4;
      
      const rowStart = this.localRowIndex;
      const rowEnd = this.localRowIndex + this.rowSpan;
      for (let i = rowStart; i < rowEnd; i++) {
        this.height += this.hot.getRowHeight(i);
      }
      
      const colStart = this.localColIndex;
      const colEnd = this.localColIndex + this.colSpan;
      for (let i = colStart; i < colEnd; i++) {
        this.width += this.hot.getColWidth(i);
      }
      
      if (!cellDef) {
        this._buildSlashes();
      }
    },
    
    getCellElement() {
      // 获取单元格DOM元素
      return this.hot.getCell(this.localRowIndex, this.localColIndex);
    },
    
    _buildSlashes() {
      const colStart = this.localColIndex;
      const colEnd = this.localColIndex + this.colSpan;
      let colWidth = 0;
      for (let i = colStart; i < colEnd; i++) {
        colWidth += this.hot.getColWidth(i);
      }
      
      let rowHeight = 0;
      const rowStart = this.localRowIndex;
      const rowEnd = this.localRowIndex + this.rowSpan;
      for (let i = rowStart; i < rowEnd; i++) {
        rowHeight += this.hot.getRowHeight(i);
      }
      
      const dataSize = this.slashData.length;
      let index = 1;
      const slashes = [];
      
      for (let i = 0; i < this.rowSpan; i++) {
        let height = 0;
        for (let j = 0; j < i; j++) {
          height += this.hot.getRowHeight(j);
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
        const width = this.hot.getColWidth(this.localColIndex + (this.colSpan - 1));
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
          x -= this.hot.getColWidth(this.localColIndex + (this.colSpan - 1));
        } else {
          x -= parseInt(x / 5);
        }
        
        let y = rowHeight;
        if (this.rowSpan > 1) {
          y -= parseInt(this.hot.getRowHeight(this.localRowIndex + (this.rowSpan - 1)) / 2) + 5;
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
          width += this.hot.getColWidth(j);
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
      
      const cellDef = this.context.getCell(this.localRowIndex, this.localColIndex);
      cellDef.value = {
        slashes,
        type: 'slash'
      };
    },
    
    doDraw(cellDef, rowIndex, colIndex) {
      // 更新本地索引，而不是直接修改props
      if (rowIndex !== null && rowIndex !== undefined) {
        this.localRowIndex = rowIndex;
      }
      
      if (colIndex !== null && colIndex !== undefined) {
        this.localColIndex = colIndex;
      }
      
      const slashValue = cellDef.value;
      const cellStyle = cellDef.cellStyle;
      
      if (!cellStyle.forecolor) {
        cellStyle.forecolor = '0,0,0';
      }
      
      let index = 0;
      const container = this.$refs.container;
      
      // 清空容器
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // 创建Raphael实例
      this.paper = Raphael(container, this.width, this.height);
      
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
          h += this.hot.getRowHeight(this.localRowIndex + j);
        }
        
        if (size == 2) h = this.height;
        
        if (index < size) {
          this.paper.path("M0 0L" + this.width + " " + h).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
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
        let h = this.height - (this.hot.getRowHeight(this.localRowIndex + (this.rowSpan - 1)))/3;
        
        if (index + 1 < size) {
          if (size == 2) h = this.height;
          this.paper.path("M0 0L" + this.width + " " + h).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
        }
        
        let slash = slashes[index];
        index++;
        
        let text = this.paper.text(0, 0, slash.text).attr(textStyle);
        text.attr({
          transform: 'T' + slash.x + "," + slash.y + "R" + slash.degree
        });
        
        if (size === 0 || index < size) {
          let w = this.width - (this.hot.getColWidth(this.localColIndex + (this.colSpan - 1)))/3;
          
          if (index + 1 < size) {
            if (size == 2) w = this.width;
            this.paper.path("M0 0L" + w + " " + this.height).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
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
          w += this.hot.getColWidth(this.localColIndex + j);
        }
        
        if (size == 2) w = this.width;
        
        this.paper.path("M0 0L" + w + " " + this.height).attr({ stroke: this.rgbToHex(cellStyle.forecolor) });
        
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
      
      // 转换为PNG并保存base64数据
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