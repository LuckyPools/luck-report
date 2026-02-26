/**
 * Created by Jacky.Gao on 2017-03-15.
 * Modified to use Vue component and remove jQuery dependency
 */
import Vue from 'vue';
import CrossTabWidgetVue from './index.vue';

export default class CrossTabWidget {
    constructor(context,rowIndex,colIndex,cellDef,value){
        this.context=context;
        this.hot=context.hot;
        this.rowIndex=rowIndex;
        this.colIndex=colIndex;
        this.value=value;
        this.slashData=[];
        if(value){
            for(let name of value.split('|')){
                this.slashData.push(name);
            }
        }

        // Vue实例相关属性
        this.vueInstance=null;
        this.container=null;

        this.refreshCell(cellDef);
    }

    refreshCell(cellDef){
        const td=this.hot.getCell(this.rowIndex,this.colIndex);
        this.rowSpan=td.rowSpan || 1;
        this.colSpan=td.colSpan || 1;

        // 计算宽高
        this.width=-2;
        this.height=-4;
        const rowStart=this.rowIndex,rowEnd=this.rowIndex+this.rowSpan;
        for(let i=rowStart;i<rowEnd;i++){
            this.height+=this.hot.getRowHeight(i);
        }
        const colStart=this.colIndex,colEnd=this.colIndex+this.colSpan;
        for(let i=colStart;i<colEnd;i++){
            this.width+=this.hot.getColWidth(i);
        }

        if(!cellDef){
            this._buildSlashes();
        }
    }

    _buildSlashes(){
        // 保留原始的斜线数据构建逻辑
        const colStart=this.colIndex,colEnd=this.colIndex+this.colSpan;
        let colWidth=0;
        for(let i=colStart;i<colEnd;i++){
            colWidth+=this.hot.getColWidth(i);
        }
        let rowHeight=0;
        const rowStart=this.rowIndex,rowEnd=this.rowIndex+this.rowSpan;
        for(let i=rowStart;i<rowEnd;i++){
            rowHeight+=this.hot.getRowHeight(i);
        }
        const dataSize=this.slashData.length;
        let index=1;
        const slashes=[];

        for(let i=0;i<this.rowSpan;i++){
            let height=0;
            for(let j=0;j<i;j++){
                height+=this.hot.getRowHeight(j);
            }
            if(i===0 || i+1<this.rowSpan){
                height+=8;
            }else{
                height-=3;
            }
            let itemName='项目'+index;
            if(dataSize>0 && index-1>=dataSize){
                break;
            }else{
                if(dataSize>0){
                    itemName=this.slashData[index-1];
                }
            }
            const degree=this._computeDegree(colWidth,height);
            const width=this.hot.getColWidth(this.colIndex+(this.colSpan-1));
            const x=parseInt(colWidth-30);
            slashes.push({
                degree,
                x,
                y:height,
                text:itemName
            });
            index++;
        }

        if(dataSize===0 || index-1<dataSize){
            let itemName='项目'+index;
            if(dataSize>0){
                itemName=this.slashData[index-1];
            }
            const degree=this._computeDegree(colWidth,rowHeight);
            let x=colWidth;
            if(this.colSpan>1){
                x-=this.hot.getColWidth(this.colIndex+(this.colSpan-1));
            }else{
                x-=parseInt(x/5);
            }
            let y=rowHeight;
            if(this.rowSpan>1){
                y-=parseInt(this.hot.getRowHeight(this.rowIndex+(this.rowSpan-1))/2)+5;
            }else{
                y-=parseInt(y/2);
            }
            slashes.push({
                degree,
                x,
                y,
                text:itemName
            });
            index++;
        }

        for(let i=0;i<this.colSpan;i++){
            let width=0;
            for(let j=0;j<i;j++){
                width+=this.hot.getColWidth(j);
            }
            let itemName='项目'+index;
            if(dataSize>0 && index-1>=dataSize){
                break;
            }else{
                if(dataSize>0){
                    itemName=this.slashData[index-1];
                }
            }
            width+=20;
            const degree=this._computeDegree(rowHeight,width);
            const y=rowHeight-20;
            slashes.push({
                degree,
                x:width,
                y,
                text:itemName
            });
            index++;
        }

        const cellDef=this.context.getCell(this.rowIndex,this.colIndex);
        cellDef.value={
            slashes,
            type:'slash'
        };
    }

    doDraw(cellDef,rowIndex,colIndex){
        if(rowIndex!=null && rowIndex!=undefined){
            this.rowIndex=rowIndex;
        }
        if(colIndex!=null && colIndex!=undefined){
            this.colIndex=colIndex;
        }

        // 获取单元格元素
        const td=this.hot.getCell(this.rowIndex,this.colIndex);

        // 清空单元格内容
        while(td.firstChild){
            td.removeChild(td.firstChild);
        }

        // 创建容器元素
        this.container=document.createElement('div');
        td.appendChild(this.container);

        // 重新计算宽高
        this.width=-2;
        this.height=-4;
        const rowStart=this.rowIndex,rowEnd=this.rowIndex+this.rowSpan;
        for(let i=rowStart;i<rowEnd;i++){
            this.height+=this.hot.getRowHeight(i);
        }
        const colStart=this.colIndex,colEnd=this.colIndex+this.colSpan;
        for(let i=colStart;i<colEnd;i++){
            this.width+=this.hot.getColWidth(i);
        }

        // 设置容器样式
        this.container.style.width=this.width+'px';
        this.container.style.height=this.height+'px';

        // 清理之前的Vue实例
        if(this.vueInstance){
            this.vueInstance.$destroy();
            this.vueInstance=null;
        }

        // 创建新的Vue实例
        this.vueInstance=new Vue({
            el:this.container,
            render:h=>h(CrossTabWidgetVue,{
                props:{
                    context:this.context,
                    rowIndex:this.rowIndex,
                    colIndex:this.colIndex,
                    cellDef:cellDef,
                    value:this.value
                }
            })
        });

        // 调用Vue组件中的doDraw方法
        const component=this.vueInstance.$children[0];
        if(component){
            // 手动设置宽高到组件实例中
            component.width=this.width;
            component.height=this.height;
            component.doDraw(cellDef,this.rowIndex,this.colIndex);
        }
    }

    _computeDegree(a,b){
        const c=Math.sqrt(a*a+b*b);
        const sin=Math.sin(b/c);
        const degree=(180/Math.PI)*Math.asin(sin);
        return parseInt(degree);
    }

    // 清理方法，避免内存泄漏
    destroy(){
        if(this.vueInstance){
            this.vueInstance.$destroy();
            this.vueInstance=null;
        }
        if(this.container && this.container.parentNode){
            this.container.parentNode.removeChild(this.container);
            this.container=null;
        }
    }
}
