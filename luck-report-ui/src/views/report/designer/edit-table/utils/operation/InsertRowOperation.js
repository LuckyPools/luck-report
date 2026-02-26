/**
 * Created by Jacky.Gao on 2017-02-17.
 */
import {setDirty,resetTableData,buildNewCellDef,undoManager} from '@/utils/table.js';
import {renderRowHeader} from '@/views/report/designer/edit-table/utils/HeaderUtils.js';
import {$t} from "@/locales";
import {showAlert} from "@/utils/comnon";

export function doInsertRow(above, number = 1){
    const selected=this.getSelected();
    if(!selected){
        showAlert($t('table.rowTip'));
        return;
    }
    let startRow=selected[0],endRow=selected[2];
    let position=startRow;
    if(startRow>endRow){
        if(above){
            position=endRow;
        }else{
            position=startRow+1;
        }
    }else{
        if(above){
            position=startRow;
        }else{
            position=endRow+1;
        }
    }
    let rowHeights=this.getSettings().rowHeights;
    let newRowHeights=rowHeights.concat([]);
    for(let i=0;i<number;i++){
        newRowHeights.splice(position,0,25);
    }
    this.alter("insert_row",position,number);
    this.context.adjustInsertRowHeaders(position);
    renderRowHeader(this,this.context);

    buildNewRowCells(this,position,number);
    this.updateSettings({
        rowHeights:newRowHeights,
        manualRowResize:newRowHeights
    });
    resetTableData(this);
    setDirty();

    const _this=this,context=this.context,cellsMap=this.context.cellsMap,removeCells=[];
    let removeRowHeight=25;
    undoManager.add({
        redo:function(){
            rowHeights=_this.getSettings().rowHeights;
            newRowHeights=rowHeights.concat([]);
            for(let i=0;i<number;i++){
                newRowHeights.splice(position,0,removeRowHeight);
            }
            _this.alter("insert_row",position,number);
            _this.context.adjustInsertRowHeaders(position);
            renderRowHeader(_this,_this.context);
            let changeCells=[];
            for(let cell of cellsMap.values()){
                let rowIndex=cell.rowNumber-1;
                if(rowIndex>=position){
                    changeCells.push(cell);
                }
            }
            for(let cell of changeCells){
                context.removeCell(cell);
            }
            for(let cell of changeCells){
                cell.rowNumber=cell.rowNumber+number;
                context.addCell(cell);
            }
            for(let cell of removeCells){
                context.addCell(cell);
            }
            _this.updateSettings({
                rowHeights:newRowHeights,
                manualRowResize:newRowHeights
            });
            resetTableData(_this);
            setDirty();
        },
        undo:function(){
            removeCells.splice(0,removeCells.length);
            rowHeights=_this.getSettings().rowHeights;
            newRowHeights=rowHeights.concat([]);
            for(let i=0;i<number;i++){
                removeRowHeight=newRowHeights[position];
                newRowHeights.splice(position,1);
            }
            _this.alter('remove_row',position,number);
            _this.context.adjustDelRowHeaders(position);
            renderRowHeader(_this,_this.context);
            _this.updateSettings({
                rowHeights:newRowHeights,
                manualRowResize:newRowHeights
            });
            let countCols=_this.countCols();
            for(let i=0;i<number;i++){
                for(let j=0;j<countCols;j++){
                    let cell=context.getCell(position,j);
                    if(cell){
                        removeCells.push(cell);
                        context.removeCell(cell);
                    }
                }
            }
            let changeCells=[];
            for(let cell of cellsMap.values()){
                let rowIndex=cell.rowNumber-1;
                if(rowIndex>position){
                    changeCells.push(cell);
                }
            }
            for(let cell of changeCells){
                context.removeCell(cell);
            }
            for(let cell of changeCells){
                cell.rowNumber=cell.rowNumber-number;
                context.addCell(cell);
            }
            resetTableData(_this);
            setDirty();
        }
    });
};


function buildNewRowCells(hot,position,number){
    const countCols=hot.countCols(),countRows=hot.countRows(),context=hot.context;
    const cellsMap=context.cellsMap,changeCells=[];
    for(let cell of cellsMap.values()){
        let rowIndex=cell.rowNumber-1;
        if(rowIndex>=position){
            changeCells.push(cell);
        }
    }
    for(let cell of changeCells){
        context.removeCell(cell);
    }
    for(let cell of changeCells){
        cell.rowNumber=cell.rowNumber+number;
        context.addCell(cell);
    }
    for(let i=0;i<number;i++){
        for(let j=0;j<countCols;j++){
            let newCellDef=buildNewCellDef(position+i+1,(j+1));
            context.addCell(newCellDef);
        }
    }
};
