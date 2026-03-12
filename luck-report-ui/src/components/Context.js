/**
 * Created by Jacky.Gao on 2017-01-25.
 * 
 * 重构说明：
 * - Context 现在只包含纯数据属性，不包含任何方法
 * - 所有操作方法已移至 Vuex mutations 和 contextActions.js
 * - 这样设计既保持了性能（直接引用），又符合 Vuex 规范（通过 mutation 修改）
 */

export default class Context {
  constructor(reportTable) {
    this.reportDef = reportTable.reportDef;
    this.cellsMap = reportTable.cellsMap;
    this.hot = reportTable.hot;
    this.hot.context = this;
    this.rowHeaders = [];
    
    // 工具数据
    this._initLetters();
  }

  _initLetters() {
    const letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    this.LETTERS = letters.concat([]);
    for(let i = 0; i < letters.length; i++) {
      let name = letters[i];
      for(let j = 0; j < letters.length; j++) {
        this.LETTERS.push(name + letters[j]);
      }
    }
  }
}
