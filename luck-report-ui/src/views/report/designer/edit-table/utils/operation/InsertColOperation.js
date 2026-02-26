/**
 * Created by Jacky.Gao on 2017-02-17.
 */
import {setDirty,resetTableData,buildNewCellDef,undoManager} from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import {$t} from "@/locales";

export function doInsertCol(left, number = 1){
    const selected=this.getSelected();
    if(!selected){
        showAlert($t('table.colTip'));
        return;
    }
    let startCol=selected[1],endCol=selected[3];
    let position=startCol;
    if(startCol>endCol){
        if(left){
            position=endCol;
        }else{
            position=startCol+1;
        }
    }else{
        if(left){
            position=startCol;
        }else{
            position=endCol+1;
        }
    }
    let colWidths=this.getSettings().colWidths;
    let newColWidths=colWidths.concat([]);
    for(let i=0;i<number;i++){
        newColWidths.splice(position,0,98);
    }
    this.alter("insert_col",position,number);
    const context=this.context,cellsMap=this.context.cellsMap,changeCells=[];
    for(let cell of cellsMap.values()){
        let colIndex=cell.columnNumber-1;
        if(colIndex>=position){
            changeCells.push(cell);
        }
    }
    for(let cell of changeCells){
        context.removeCell(cell);
    }
    for(let cell of changeCells){
        cell.columnNumber=cell.columnNumber+number;
        context.addCell(cell);
    }
    let countRows=this.countRows();
    for(let i=0;i<number;i++){
        for(let j=0;j<countRows;j++){
            let newCellDef=buildNewCellDef(j+1,position+i+1);
            context.addCell(newCellDef);
        }
    }
    this.updateSettings({
        colWidths:newColWidths,
        manualColumnResize:newColWidths
    });
    resetTableData(this);
    setDirty();

    const _this=this,removeCells=[];
    let removeColWidth=98;
    undoManager.add({
        redo:function(){
            colWidths=_this.getSettings().colWidths;
            newColWidths=colWidths.concat([]);
            for(let i=0;i<number;i++){
                newColWidths.splice(position,0,removeColWidth);
            }
            _this.alter("insert_col",position,number);
            changeCells.splice(0,changeCells.length);
            for(let cell of cellsMap.values()){
                let colIndex=cell.columnNumber-1;
                if(colIndex>=position){
                    changeCells.push(cell);
                }
            }
            for(let cell of changeCells){
                context.removeCell(cell);
            }
            for(let cell of changeCells){
                cell.columnNumber=cell.columnNumber+number;
                context.addCell(cell);
            }
            for(let cell of removeCells){
                context.addCell(cell);
            }
            _this.updateSettings({
                colWidths:newColWidths,
                manualColumnResize:newColWidths
            });
            resetTableData(_this);
            setDirty();
        },
        undo:function(){
            removeCells.splice(0,removeCells.length);
            colWidths=_this.getSettings().colWidths;
            newColWidths=colWidths.concat([]);
            for(let i=0;i<number;i++){
                removeColWidth=newColWidths[position];
                newColWidths.splice(position,1);
            }
            _this.alter('remove_col',position,number);
            _this.updateSettings({
                colWidths:newColWidths,
                manualColumnResize:newColWidths
            });
            let countRows=_this.countRows();
            for(let i=0;i<number;i++){
                for(let j=0;j<countRows;j++){
                    let cell=context.getCell(j,position);
                    if(cell){
                        context.removeCell(cell);
                        removeCells.push(cell);
                    }
                }
            }
            changeCells.splice(0,changeCells.length);
            for(let cell of cellsMap.values()) {
                let colIndex = cell.columnNumber - 1;
                if(colIndex>position){
                    changeCells.push(cell);
                }
            }
            for(let cell of changeCells){
                context.removeCell(cell);
            }
            for(let cell of changeCells){
                cell.columnNumber=cell.columnNumber-number;
                context.addCell(cell);
            }

            resetTableData(_this);
            setDirty();
        }
    });
};
