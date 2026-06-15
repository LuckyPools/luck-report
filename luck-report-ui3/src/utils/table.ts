/**
 * Created by Jacky.gao on 2016/7/27.
 */
import UndoManager from 'undo-manager';
import MessageBox from '@/utils/messagebox';
import { useReportStore } from '@/store/modules/report';
import {getCell, getCellName} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager';
import { getUrlQueryString } from '@/utils/url';
import { t, i18n } from '@/locales';
import type { ReportCell } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** MessageBox 抽象 */
const MB: any = MessageBox

/**
 * 表格对象（handsontable）抽象类型
 * - 直接复用项目内别名 HandsontableInstance（即 _Handsontable.Core）
 * - 这样 Operation 文件传入 HandsontableInstance 时不会因字段缺失报错
 */
type HotInstance = HandsontableInstance

/**
 * 重置表格数据（将单元格定义转换为显示文本后回填到表格）
 * @param hot handsontable 实例
 */
export function resetTableData(hot: HotInstance): void {
    const countCols=hot.countCols(),countRows=hot.countRows(),data: string[][]=[];
    for(let i=0;i<countRows;i++){
        let rowData: string[]=[];
        for(let j=0;j<countCols;j++){
            let td=hot.getCell(i,j);
            if(!td){
                rowData.push("");
                continue;
            }
            let cellDef= getCell(i,j);
            if(cellDef){
                let valueType=(cellDef as any).value.type,value=(cellDef as any).value;
                if(valueType==='dataset'){
                    let text=value.datasetName+"."+value.aggregate+"(";
                    let prop=value.property;
                    if(prop.length>13){
                        text+=prop.substring(0,10)+'..)';
                    }else{
                        text+=prop+")";
                    }
                    rowData.push(text);
                }else if(valueType==='expression'){
                    let v=value.value || '';
                    if(v.length>16){
                        v=v.substring(0,13)+'...';
                    }
                    rowData.push(v);
                }else{
                    rowData.push(value.value || "");
                }
            }else{
                rowData.push("");
            }
        }
        data.push(rowData);
    }
    hot.loadData(data);
};

/**
 * 构建新的单元格定义
 * @param rowNumber 行号（从 1 开始）
 * @param columnNumber 列号（从 1 开始）
 * @returns 单元格定义对象（符合 ReportCell 形状）
 */
export function buildNewCellDef(rowNumber: number, columnNumber: number): ReportCell {
    const cellDef: ReportCell = {
        rowNumber,
        columnNumber,
        expand: 'None',
        cellStyle: { fontSize: 10, forecolor: '0,0,0', fontFamily: '宋体', align: 'center', valign: 'middle' },
        value: { type: 'simple', value: '' }
    }
    return cellDef
}

/**
 * 将报表上下文序列化为 ureport XML
 * @param context 报表上下文
 * @returns 经 URI 编码后的 XML 字符串
 */
export function tableToXml(context: any): string {
    const hot: any = TableManager.get();
    const countRows=hot.countRows(),countCols=hot.countCols();
    let xml=`<?xml version="1.0" encoding="UTF-8"?><ureport>`;
    let rowsXml='',columnXml='';
    const rowHeaders=context.rowHeaders;
    for(let i=0;i<countRows;i++){
        let height=hot.getRowHeight(i) || 16;
        height=pixelToPoint(height);
        let band=null;
        for(let header of rowHeaders){
            if(header.rowNumber===i){
                band=header.band;
                break;
            }
        }
        if(band){
            rowsXml+=`<row row-number="${i+1}" height="${height}" band="${band}"/>`;
        }else{
            rowsXml+=`<row row-number="${i+1}" height="${height}"/>`;
        }
    }
    for(let i=0;i<countCols;i++){
        let width=hot.getColWidth(i) || 30;
        width=pixelToPoint(width);
        columnXml+=`<column col-number="${i+1}" width="${width}"/>`;
    }
    let cellXml='',spanData: string[]=[];
    for(let i=0;i<countRows;i++){
        for(let j=0;j<countCols;j++){
            if(spanData.indexOf(i+","+j)>-1){
                continue;
            }
            let cellDef: any = getCell(i,j);
            if(!cellDef){
                continue;
            }
            let cellName= getCellName(i,j);
            cellXml+=`<cell expand="${cellDef.expand}" name="${cellName}" row="${(i+1)}" col="${(j+1)}"`;
            if(cellDef.leftParentCellName && cellDef.leftParentCellName!==''){
                cellXml+=` left-cell="${cellDef.leftParentCellName}"`;
            }
            if(cellDef.topParentCellName && cellDef.topParentCellName!==''){
                cellXml+=` top-cell="${cellDef.topParentCellName}"`;
            }
            if(cellDef.fillBlankRows){
                cellXml+=` fill-blank-rows="${cellDef.fillBlankRows}"`;
                if(cellDef.multiple){
                    cellXml+=` multiple="${cellDef.multiple}"`;
                }
            }

            const span=getSpan(hot,i,j);
            let rowSpan=span.rowspan,colSpan=span.colspan;
            let startRow=i,endRow=i+rowSpan-1,startCol=j,endCol=j+colSpan-1;
            for(let r=startRow;r<=endRow;r++){
                for(let c=startCol;c<=endCol;c++){
                    spanData.push(r+","+c);
                }
            }
            if(rowSpan>1){
                cellXml+=` row-span="${rowSpan}"`;
            }
            if(colSpan>1){
                cellXml+=` col-span="${colSpan}"`;
            }

            if(cellDef.linkUrl && cellDef.linkUrl!==''){
                cellXml+=` link-url="${cellDef.linkUrl}"`;
            }
            if(cellDef.linkTargetWindow && cellDef.linkTargetWindow!==''){
                cellXml+=` link-target-window="${cellDef.linkTargetWindow}"`;
            }

            cellXml+='>';
            let cellStyle=cellDef.cellStyle;
            cellXml+=buildCellStyle(cellStyle);
            if(cellDef.linkParameters && cellDef.linkParameters.length>0){
                for(let param of cellDef.linkParameters){
                    cellXml+=`<link-parameter name="${param.name}">`;
                    cellXml+=`<value><![CDATA[${param.value}]]></value>`;
                    cellXml+=`</link-parameter>`;
                }
            }
            const value=cellDef.value;
            if(value.type==='dataset'){
                let msg=null;
                if(!value.datasetName){
                    msg=i18n.global.t('validation.cell.datasetNameRequired', { cell: cellName });
                }
                if(!msg && !value.property){
                    msg=i18n.global.t('validation.cell.propertyRequired', { cell: cellName });
                }
                if(!msg && !value.aggregate){
                    msg=i18n.global.t('validation.cell.aggregateRequired', { cell: cellName });
                }
                if(msg){
                    MB.alert(msg);
                    throw msg;
                }
                const mappingType=value.mappingType || 'simple';
                cellXml+=`<dataset-value dataset-name="${encode(value.datasetName)}" aggregate="${value.aggregate}" property="${value.property}" order="${value.order}" mapping-type="${mappingType}"`;
                if(mappingType==='dataset'){
                    cellXml+=` mapping-dataset="${value.mappingDataset}" mapping-key-property="${value.mappingKeyProperty}" mapping-value-property="${value.mappingValueProperty}"`;
                }
                cellXml+='>';
                cellXml+=buildConditions(value.conditions);
                if(value.aggregate==='customgroup'){
                    const groupItems=Array.isArray(value.groupItems) ? value.groupItems : [];
                    for(let groupItem of groupItems){
                        cellXml+=`<group-item name="${groupItem.name}">`;
                        for(let condition of groupItem.conditions){
                            cellXml+=`<condition property="${condition.left}" op="${encode(condition.operation || condition.op)}" id="${condition.id}"`;
                            if(condition.join){
                                cellXml+=` join="${condition.join}">`;
                            }else{
                                cellXml+=`>`;
                            }
                            cellXml+=`<value><![CDATA[${condition.right}]]></value>`;
                            cellXml+=`</condition>`;
                        }
                        cellXml+='</group-item>';
                    }
                }
                if(mappingType==='simple'){
                    const mappingItems=value.mappingItems;
                    if(mappingItems && mappingItems.length>0){
                        for(let mappingItem of mappingItems){
                            cellXml+=`<mapping-item value="${encode(mappingItem.value)}" label="${encode(mappingItem.label)}"/>`;
                        }
                    }
                }
                cellXml+=`</dataset-value>`;
            }else if(value.type==='expression'){
                if(!value.value || value.value===''){
                    const msg=i18n.global.t('validation.cell.expressionRequired', { cell: cellName });
                    MB.alert(msg);
                    throw msg;
                }
                cellXml+=`<expression-value>`;
                cellXml+=`<![CDATA[${value.value}]]>`;
                cellXml+=`</expression-value>`;
            }else if(value.type==='simple'){
                cellXml+=`<simple-value>`;
                cellXml+=`<![CDATA[${value.value || ''}]]>`;
                cellXml+=`</simple-value>`;
            }else if(value.type==='image'){
                let msg=null;
                if(value.source==='text' && (!value.value || value.value.trim()==='')){
                    msg=i18n.global.t('validation.cell.imagePathRequired', { cell: cellName });
                }
                if(value.source==='expression' && (!value.value || value.value.trim()==='')){
                    msg=i18n.global.t('validation.cell.imageExpressionRequired', { cell: cellName });
                }
                if(msg){
                    MB.alert(msg);
                    throw msg;
                }
                cellXml+=`<image-value source="${value.source}"`;
                if(value.width){
                    cellXml+=` width="${value.width}"`
                }
                if(value.height){
                    cellXml+=` height="${value.height}"`;
                }
                cellXml+=`>`;
                cellXml+=`<text>`;
                cellXml+=`<![CDATA[${value.value}]]>`;
                cellXml+=`</text>`;
                cellXml+=`</image-value>`;
            }else if(value.type==='zxing'){
                let msg=null;
                if(value.source==='text' && (!value.value || value.value.trim()==='')){
                    msg=i18n.global.t('validation.cell.zxingTextRequired', { cell: cellName });
                }
                if(value.source==='expression' && (!value.value || value.value.trim()==='')){
                    msg=i18n.global.t('validation.cell.zxingExpressionRequired', { cell: cellName });
                }
                if(msg){
                    MB.alert(msg);
                    throw msg;
                }
                cellXml+=`<zxing-value source="${value.source}" category="${value.category}" width="${value.width}" height="${value.height}"`;
                if(value.format){
                    cellXml+=` format="${value.format}"`;
                }
                cellXml+=`>`;
                cellXml+=`<text>`;
                cellXml+=`<![CDATA[${value.value}]]>`;
                cellXml+=`</text>`;
                cellXml+=`</zxing-value>`;
            }else if(value.type==='slash'){
                cellXml+=`<slash-value>`;
                const slashes=value.slashes;
                for(let slash of slashes){
                    cellXml+=`<slash text="${slash.text}" x="${slash.x}" y="${slash.y}" degree="${slash.degree}"/>`;
                }
                cellXml+=`<base64-data>`;
                cellXml+=`<![CDATA[${value.base64Data}]]>`;
                cellXml+=`</base64-data>`;
                cellXml+=`</slash-value>`;
            }else if(value.type==='chart'){
                const chart=value.chart;
                const dataset=chart.dataset;
                const chartType=dataset.type;
                let msg=null;

                // 校验数据集名称
                if(!dataset.datasetName){
                    msg=i18n.global.t('validation.cell.chartDatasetRequired', { cell: cellName });
                }

                // 根据图表类型进行不同校验
                if(!msg){
                    if(chartType==='scatter'){
                        // 散点图校验：categoryProperty、xProperty、yProperty 必填
                        if(!dataset.categoryProperty){
                            msg=i18n.global.t('validation.cell.scatterCategoryPropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.xProperty){
                            msg=i18n.global.t('validation.cell.scatterXPropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.yProperty){
                            msg=i18n.global.t('validation.cell.scatterYPropertyRequired', { cell: cellName });
                        }
                    }else if(chartType==='bubble'){
                        // 气泡图校验：categoryProperty、xProperty、yProperty、rProperty 必填
                        if(!dataset.categoryProperty){
                            msg=i18n.global.t('validation.cell.bubbleCategoryPropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.xProperty){
                            msg=i18n.global.t('validation.cell.bubbleXPropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.yProperty){
                            msg=i18n.global.t('validation.cell.bubbleYPropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.rProperty){
                            msg=i18n.global.t('validation.cell.bubbleRPropertyRequired', { cell: cellName });
                        }
                    }else{
                        // 普通图表校验：valueProperty、collectType 必填
                        if(!dataset.valueProperty){
                            msg=i18n.global.t('validation.cell.chartValuePropertyRequired', { cell: cellName });
                        }
                        if(!msg && !dataset.collectType){
                            msg=i18n.global.t('validation.cell.chartCollectTypeRequired', { cell: cellName });
                        }
                        // line、bar、horizontalBar、area、radar 需要分类属性
                        if(!msg && ['line','bar','horizontalBar','area','radar'].includes(chartType) && !dataset.categoryProperty){
                            msg=i18n.global.t('validation.cell.chartCategoryPropertyRequired', { cell: cellName });
                        }
                        // 系列类型校验
                        if(!msg && dataset.seriesType==='property' && !dataset.seriesProperty){
                            msg=i18n.global.t('validation.cell.chartSeriesPropertyRequired', { cell: cellName });
                        }
                        if(!msg && dataset.seriesType==='text' && !dataset.seriesText){
                            msg=i18n.global.t('validation.cell.chartSeriesTextRequired', { cell: cellName });
                        }
                    }
                }

                if(msg){
                    MB.alert(msg);
                    throw msg;
                }

                cellXml+=`<chart-value>`;
                cellXml+=`<dataset dataset-name="${dataset.datasetName}" type="${dataset.type}"`;
                if(dataset.categoryProperty){
                    cellXml+=` category-property="${dataset.categoryProperty}"`;
                }
                if(dataset.seriesProperty){
                    cellXml+=` series-property="${dataset.seriesProperty}"`;
                }
                if(dataset.seriesType){
                    cellXml+=` series-type="${dataset.seriesType}"`;
                }
                if(dataset.seriesText){
                    cellXml+=` series-text="${dataset.seriesText}"`;
                }
                if(dataset.valueProperty){
                    cellXml+=` value-property="${dataset.valueProperty}"`;
                }
                if(dataset.rProperty){
                    cellXml+=` r-property="${dataset.rProperty}"`;
                }
                if(dataset.xProperty){
                    cellXml+=` x-property="${dataset.xProperty}"`;
                }
                if(dataset.yProperty){
                    cellXml+=` y-property="${dataset.yProperty}"`;
                }
                if(dataset.collectType){
                    cellXml+=` collect-type="${dataset.collectType}"`;
                }
                cellXml+=`/>`;
                const xaxes=chart.xaxes;
                if(xaxes){
                    cellXml+=`<xaxes`;
                    if(xaxes.rotation){
                        cellXml+=` rotation="${xaxes.rotation}"`;
                    }
                    cellXml+=`>`;
                    const scaleLabel=xaxes.scaleLabel;
                    if(scaleLabel){
                        cellXml+=`<scale-label display="${scaleLabel.display}"`;
                        if(scaleLabel.labelString){
                            cellXml+=` label-string="${scaleLabel.labelString}"`;
                        }
                        cellXml+=`/>`;
                    }
                    cellXml+=`</xaxes>`;
                }
                const yaxes=chart.yaxes;
                if(yaxes){
                    cellXml+=`<yaxes`;
                    if(yaxes.rotation){
                        cellXml+=` rotation="${yaxes.rotation}"`;
                    }
                    cellXml+=`>`;
                    const scaleLabel=yaxes.scaleLabel;
                    if(scaleLabel){
                        cellXml+=`<scale-label display="${scaleLabel.display}"`;
                        if(scaleLabel.labelString){
                            cellXml+=` label-string="${scaleLabel.labelString}"`;
                        }
                        cellXml+=`/>`;
                    }
                    cellXml+=`</yaxes>`;
                }
                const options=chart.options;
                if(options){
                    for(let option of options){
                        cellXml+=`<option type="${option.type}"`;
                        if(option.position){
                            cellXml+=` position="${option.position}"`;
                        }
                        if(option.display!==undefined && option.display!==null){
                            cellXml+=` display="${option.display}"`;
                        }
                        if(option.duration){
                            cellXml+=` duration="${option.duration}"`;
                        }
                        if(option.easing){
                            cellXml+=` easing="${option.easing}"`;
                        }
                        if(option.text){
                            cellXml+=` text="${option.text}"`;
                        }
                        cellXml+=`/>`;
                    }
                }
                const plugins=chart.plugins || [];
                for(let plugin of plugins){
                    cellXml+=`<plugin name="${plugin.name}" display="${plugin.display}"/>`;
                }
                if(plugins){

                }
                cellXml+=`</chart-value>`;
            }
            const propertyConditions=cellDef.conditionPropertyItems || [];
            for(let pc of propertyConditions){
                cellXml+=`<condition-property-item name="${pc.name}"`;
                const rowHeight=pc.rowHeight;
                if(rowHeight!==null && rowHeight!==undefined && rowHeight!==-1){
                    cellXml+=` row-height="${rowHeight}"`;
                }
                const colWidth=pc.colWidth;
                if(colWidth!==null && colWidth!==undefined && colWidth!==-1){
                    cellXml+=` col-width="${colWidth}"`;
                }
                if(pc.newValue && pc.newValue!==''){
                    cellXml+=` new-value="${pc.newValue}"`;
                }
                if(pc.linkUrl && pc.linkUrl!==''){
                    cellXml+=` link-url="${pc.linkUrl}"`;
                    let targetWindow=pc.linkTargetWindow;
                    if(!targetWindow || targetWindow===''){
                        targetWindow="_self";
                    }
                    cellXml+=` link-target-window="${pc.linkTargetWindow}"`;
                }
                cellXml+=`>`;
                const paging=pc.paging;
                if(paging){
                    cellXml+=`<paging position="${paging.position}" line="${paging.line}"/>`;
                }
                if(pc.linkParameters && pc.linkParameters.length>0){
                    for(let param of pc.linkParameters){
                        cellXml+=`<link-parameter name="${param.name}">`;
                        cellXml+=`<value><![CDATA[${param.value}]]></value>`;
                        cellXml+=`</link-parameter>`;
                    }
                }
            }
            cellXml+=`</cell>`;
        }
    }
    xml+=rowsXml;
    xml+=columnXml;
    xml+=cellXml;
    if(context.reportDef.header){
        const header=context.reportDef.header;
        if(header && (header.left || header.center || header.right)){
            xml+='<header ';
            if(header.fontFamily){
                xml+=` font-family="${header.fontFamily}"`
            }
            if(header.fontSize){
                xml+=` font-size="${header.fontSize}"`
            }
            if(header.forecolor){
                xml+=` forecolor="${header.forecolor}"`
            }
            if(header.bold){
                xml+=` bold="${header.bold}"`
            }
            if(header.italic){
                xml+=` italic="${header.italic}"`
            }
            if(header.underline){
                xml+=` underline="${header.underline}"`
            }
            if(header.margin){
                xml+=` margin="${header.margin}"`
            }
            xml+='>';
            if(header.left){
                xml+=`<left><![CDATA[${header.left}]]></left>`;
            }
            if(header.center){
                xml+=`<center><![CDATA[${header.center}]]></center>`;
            }
            if(header.right){
                xml+=`<right><![CDATA[${header.right}]]></right>`;
            }
            xml+='</header>';
        }
    }
    const footer=context.reportDef.footer;
    if(footer && (footer.left || footer.center || footer.right)){
        xml+='<footer ';
        if(footer.fontFamily){
            xml+=` font-family="${footer.fontFamily}"`
        }
        if(footer.fontSize){
            xml+=` font-size="${footer.fontSize}"`
        }
        if(footer.forecolor){
            xml+=` forecolor="${footer.forecolor}"`
        }
        if(footer.bold){
            xml+=` bold="${footer.bold}"`
        }
        if(footer.italic){
            xml+=` italic="${footer.italic}"`
        }
        if(footer.underline){
            xml+=` underline="${footer.underline}"`
        }
        if(footer.margin){
            xml+=` margin="${footer.margin}"`
        }
        xml+='>';
        if(footer.left){
            xml+=`<left><![CDATA[${footer.left}]]></left>`;
        }
        if(footer.center){
            xml+=`<center><![CDATA[${footer.center}]]></center>`;
        }
        if(footer.right){
            xml+=`<right><![CDATA[${footer.right}]]></right>`;
        }
        xml+='</footer>';
    }
    let datasourceXml="";
    const datasources=context.reportDef.datasources;
    for(let datasource of datasources){
        let ds=`<datasource name="${encode(datasource.name)}" type="${datasource.type}"`;
        let type=datasource.type;
        if(type==='jdbc'){
            ds+=` username="${encode(datasource.username)}"`;
            ds+=` password="${encode(datasource.password)}"`;
            ds+=` url="${encode(datasource.url)}"`;
            ds+=` driver="${datasource.driver}"`;
            ds+='>';
            for(let dataset of datasource.datasets){
                ds+=`<dataset name="${encode(dataset.name)}" type="sql">`;
                ds+=`<sql><![CDATA[${dataset.sql}]]></sql>`;
                for(let field of dataset.fields){
                    ds+=`<field name="${field.name}"/>`;
                }
                for(let parameter of dataset.parameters){
                    ds+=`<parameter name="${encode(parameter.name)}" type="${parameter.type}" default-value="${encode(parameter.defaultValue)}"/>`;
                }
                ds+=`</dataset>`;
            }
        }else if(type==='spring'){
            ds+=` bean="${datasource.beanId}">`;
            for(let dataset of datasource.datasets){
                ds+=`<dataset name="${encode(dataset.name)}" type="bean" method="${dataset.method}" clazz="${dataset.clazz}">`;
                for(let field of dataset.fields){
                    ds+=`<field name="${field.name}"/>`;
                }
                ds+=`</dataset>`;
            }
        }else if(type==='buildin'){
            ds+='>';
            for(let dataset of datasource.datasets){
                ds+=`<dataset name="${encode(dataset.name)}" type="sql">`;
                ds+=`<sql><![CDATA[${dataset.sql}]]></sql>`;
                for(let field of dataset.fields){
                    ds+=`<field name="${field.name}"/>`;
                }
                for(let parameter of dataset.parameters){
                    ds+=`<parameter name="${parameter.name}" type="${parameter.type}" default-value="${parameter.defaultValue}"/>`;
                }
                ds+=`</dataset>`;
            }
        }
        ds+="</datasource>";
        datasourceXml+=ds;
    }
    xml+=datasourceXml;
    const paper=context.reportDef.paper;
    let htmlIntervalRefreshValue=0;
    if(paper.htmlIntervalRefreshValue!==null && paper.htmlIntervalRefreshValue!==undefined){
        htmlIntervalRefreshValue=paper.htmlIntervalRefreshValue;
    }
    xml+=`<paper type="${paper.paperType}" left-margin="${paper.leftMargin}" right-margin="${paper.rightMargin}"
    top-margin="${paper.topMargin}" bottom-margin="${paper.bottomMargin}" paging-mode="${paper.pagingMode}" fixrows="${paper.fixRows}"
    width="${paper.width}" height="${paper.height}" orientation="${paper.orientation}" html-report-align="${paper.htmlReportAlign}" bg-image="${paper.bgImage ? encode(paper.bgImage) : ''}" html-interval-refresh-value="${htmlIntervalRefreshValue}" column-enabled="${paper.columnEnabled}"`;
    if(paper.columnEnabled){
        xml+=` column-count="${paper.columnCount}" column-margin="${paper.columnMargin}"`;
    }
    xml+=`></paper>`;
    if(context.reportDef.searchForm){
        const searchFormXml = objToXml(context.reportDef.searchForm);
        xml+=searchFormXml;
    }
    xml+=`</ureport>`;
    xml=encodeURIComponent(xml);
    return xml;
};

/**
 * 获取指定单元格的合并信息
 * @param hot handsontable 实例
 * @param row 行索引
 * @param col 列索引
 * @returns 包含 rowspan/colspan 的对象
 */
function getSpan(hot: HotInstance, row: number, col: number): { rowspan: number; colspan: number } {
    // 官方 d.ts 中 mergeCells 字段类型为 `true | Handsontable.MergeCells.Settings[]`
    // 项目运行时实际拿到的是数组（当值为 true 时不会有设置项），先做类型守卫再迭代
    const mergeCells = hot.getSettings().mergeCells
    const mergeList: Array<{ row: number; col: number; rowspan: number; colspan: number }> = Array.isArray(mergeCells) ? mergeCells : []
    for (const item of mergeList) {
        if (item.row === row && item.col === col) {
            return item
        }
    }
    return { rowspan: 0, colspan: 0 }
}

/**
 * 构建条件片段 XML
 * @param conditions 条件数组
 * @returns 拼接后的条件 XML
 */
function buildConditions(conditions: any[]): string {
    let cellXml='';
    if(conditions){
        const size=conditions.length;
        for(let condition of conditions){
            if(!condition.type || condition.type==='property'){
                if(condition.left){
                    cellXml+=`<condition property="${condition.left}" op="${encode(condition.operation)}" id="${condition.id}"`;
                }else{
                    cellXml+=`<condition op="${encode(condition.operation)}" id="${condition.id}"`;
                }
                cellXml+=` type="${condition.type}"`;
                if(condition.join && size>1){
                    cellXml+=` join="${condition.join}">`;
                }else{
                    cellXml+=`>`;
                }
                cellXml+=`<value><![CDATA[${condition.right}]]></value>`;
            }else{
                cellXml+=`<condition type="${condition.type}" op="${encode(condition.operation)}" `;
                if(condition.join && size>1){
                    cellXml+=` join="${condition.join}">`;
                }else{
                    cellXml+=`>`;
                }
                cellXml+=`<left><![CDATA[${condition.left}]]></left>`;
                cellXml+=`<right><![CDATA[${condition.right}]]></right>`;
            }
            cellXml+=`</condition>`;
        }
    }
    return cellXml;
};

/**
 * 构建单元格样式 XML
 * @param cellStyle 单元格样式对象
 * @param condition 是否条件样式（可选）
 * @returns 样式 XML
 */
function buildCellStyle(cellStyle: any, condition?: boolean): string {
    let cellXml="<cell-style";
    if(condition){
        cellXml+=` for-condition="true"`;
    }
    if(cellStyle.fontSize && cellStyle.fontSize!==''){
        cellXml+=` font-size="${cellStyle.fontSize}"`;
    }
    if(cellStyle.fontSizeScope){
        cellXml+=` font-size-scope="${cellStyle.fontSizeScope}"`;
    }
    if(cellStyle.forecolor && cellStyle.forecolor!==''){
        cellXml+=` forecolor="${cellStyle.forecolor}"`;
    }
    if(cellStyle.forecolorScope){
        cellXml+=` forecolor-scope="${cellStyle.forecolorScope}"`;
    }
    if(cellStyle.fontFamily){
        if(cellStyle.fontFamily==='0'){
            cellXml+=` font-family=""`;
        }else{
            cellXml+=` font-family="${cellStyle.fontFamily}"`;
        }
    }
    if(cellStyle.fontFamilyScope){
        cellXml+=` font-family-scope="${cellStyle.fontFamilyScope}"`;
    }
    if(cellStyle.bgcolor && cellStyle.bgcolor!==''){
        cellXml+=` bgcolor="${cellStyle.bgcolor}"`;
    }
    if(cellStyle.bgcolorScope){
        cellXml+=` bgcolor-scope="${cellStyle.bgcolorScope}"`;
    }
    if(cellStyle.format && cellStyle.format!==''){
        cellXml+=` format="${cellStyle.format}"`;
    }
    if(cellStyle.bold!==undefined && cellStyle.bold!==null){
        cellXml+=` bold="${cellStyle.bold}"`;
    }
    if(cellStyle.boldScope){
        cellXml+=` bold-scope="${cellStyle.boldScope}"`;
    }
    if(cellStyle.italic!==undefined && cellStyle.italic!==null){
        cellXml+=` italic="${cellStyle.italic}"`;
    }
    if(cellStyle.italicScope){
        cellXml+=` italic-scope="${cellStyle.italicScope}"`;
    }
    if(cellStyle.underline!==undefined && cellStyle.underline!==null){
        cellXml+=` underline="${cellStyle.underline}"`;
    }
    if(cellStyle.underlineScope){
        cellXml+=` underline-scope="${cellStyle.underlineScope}"`;
    }
    if(cellStyle.wrapCompute!==undefined && cellStyle.wrapCompute!==null){
        cellXml+=` wrap-compute="${cellStyle.wrapCompute}"`;
    }
    if(cellStyle.align && cellStyle.align!==''){
        cellXml+=` align="${cellStyle.align}"`;
    }
    if(cellStyle.alignScope){
        cellXml+=` align-scope="${cellStyle.alignScope}"`;
    }
    if(cellStyle.valign && cellStyle.valign!==''){
        cellXml+=` valign="${cellStyle.valign}"`;
    }
    if(cellStyle.valignScope){
        cellXml+=` valign-scope="${cellStyle.valignScope}"`;
    }
    if(cellStyle.lineHeight){
        cellXml+=` line-height="${cellStyle.lineHeight}"`;
    }
    cellXml+='>';
    let leftBorder=cellStyle.leftBorder;
    if(leftBorder && leftBorder.style!=="none"){
        cellXml+=`<left-border width="${leftBorder.width}" style="${leftBorder.style}" color="${leftBorder.color}"/>`;
    }
    let rightBorder=cellStyle.rightBorder;
    if(rightBorder && rightBorder.style!=="none"){
        cellXml+=`<right-border width="${rightBorder.width}" style="${rightBorder.style}" color="${rightBorder.color}"/>`;
    }
    let topBorder=cellStyle.topBorder;
    if(topBorder && topBorder.style!=="none"){
        cellXml+=`<top-border width="${topBorder.width}" style="${topBorder.style}" color="${topBorder.color}"/>`;
    }
    let bottomBorder=cellStyle.bottomBorder;
    if(bottomBorder && bottomBorder.style!=="none"){
        cellXml+=`<bottom-border width="${bottomBorder.width}" style="${bottomBorder.style}" color="${bottomBorder.color}"/>`;
    }
    cellXml+='</cell-style>';
    return cellXml;
};

/**
 * 对 XML 文本进行实体转义
 * @param text 待转义的文本
 * @returns 转义后的文本
 */
export function encode(text: string): string {
    let result = text.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] as string;});
    return result;
};

/**
 * 获取 URL 中指定名称的参数值
 * @param name 参数名
 * @returns 参数值或 null
 */
export function getParameter(name: string): string | null {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = getUrlQueryString().match(reg);
    if (r != null) return r[2];
    return null;
};

/**
 * 毫米转磅
 * @param mm 毫米值
 * @returns 转换后的磅值
 */
export function mmToPoint(mm: number): number {
    let value=mm*2.834646;
    return Math.round(value);
};

/**
 * 磅转毫米
 * @param point 磅值
 * @returns 转换后的毫米值
 */
export function pointToMM(point: number): number {
    let value=point*0.352778;
    return Math.round(value);
};

/**
 * 磅转像素
 * @param point 磅值
 * @returns 转换后的像素值
 */
export function pointToPixel(point: number): number {
    const value=point * 1.33;
    return Math.round(value);
};

/**
 * 像素转磅
 * @param pixel 像素值
 * @returns 转换后的磅值
 */
export function pixelToPoint(pixel: number): number {
    const value=pixel * 0.75;
    return Math.round(value);
};

/**
 * 按指定格式格式化日期
 * 支持 format 占位符：y/M/d/H/m/s
 * @param date 日期（Date/时间戳/字符串）
 * @param format 格式字符串
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date | number | string, format: string): string {
    if(typeof date === 'number'){
        date=new Date(date);
    }
    if(typeof date==='string'){
        return date;
    }
    var o: Record<string, number> = {
        "M+" : date.getMonth()+1,
        "d+" : date.getDate(),
        "H+" : date.getHours(),
        "m+" : date.getMinutes(),
        "s+" : date.getSeconds()
    };
    if(/(y+)/.test(format))
        format=format.replace(String(RegExp.$1), (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(format))
            format = format.replace(String(RegExp.$1), (RegExp.$1.length==1) ? (""+ o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return format;
};

/** 纸张尺寸（毫米） */
interface PaperSize {
    width: number
    height: number
}

/**
 * 构建标准纸张尺寸列表（A/B 系列）
 * @returns 键为纸张代号、值为 {width,height} 的对象
 */
export function buildPageSizeList(): Record<string, PaperSize> {
    return {
        A0:{width:841,height:1189},
        A1:{width:594,height:841},
        A2:{width:420,height:594},
        A3:{width:297,height:420},
        A4:{width:210,height:297},
        A5:{width:148,height:210},
        A6:{width:105,height:148},
        A7:{width:74,height:105},
        A8:{width:52,height:74},
        A9:{width:37,height:52},
        A10:{width:26,height:37},
        B0:{width:1000,height:1414},
        B1:{width:707,height:1000},
        B2:{width:500,height:707},
        B3:{width:353,height:500},
        B4:{width:250,height:353},
        B5:{width:176,height:250},
        B6:{width:125,height:176},
        B7:{width:88,height:125},
        B8:{width:62,height:88},
        B9:{width:44,height:62},
        B10:{width:31,height:44}
    }
}

/** 全局 UndoManager 实例 */
export const undoManager=new UndoManager();

/**
 * 设置脏数据状态，启用保存按钮
 */
export function setDirty(): void {
    useReportStore().setDisableSaveBtn(false);
}

/**
 * 重置脏数据状态，禁用保存按钮
 */
export function resetDirty(): void {
    useReportStore().setDisableSaveBtn(true);
}

/**
 * 将对象转换为 XML 字符串
 * @param obj 待转换对象
 * @param indent 缩进级别，可选
 * @param defaultTag 当对象无 tag 字段时的默认标签，可选
 * @returns XML 字符串
 */
export function objToXml(obj: any, indent: number = 0, defaultTag: string | null = null): string {
    if (!obj || typeof obj !== 'object') {
        return '';
    }

    const specialArrays = ['children', 'fields', 'options'];
    const indentStr = '    '.repeat(indent);

    let tagName = obj.tag;
    if (!tagName) {
        if (defaultTag) {
            tagName = defaultTag;
        } else {
            return '';
        }
    }

    if (tagName === 'u-option' || tagName === 'option') {
        tagName = 'option';
    } else if (tagName.startsWith('u-')) {
        tagName = tagName.substring(2);
    }

    let attributes = '';
    for (const key in obj) {
        if (specialArrays.includes(key)) continue;

        const value = obj[key];
        if (Array.isArray(value) || typeof value === 'object') {
            const jsonStr = JSON.stringify(value);
            attributes += ` ${key}="${jsonStr.replace(/"/g, '&quot;')}" `;
        } else {
            attributes += ` ${key}="${value}" `;
        }
    }

    let childrenContent = '';
    for (const key of specialArrays) {
        if (obj[key] && Array.isArray(obj[key])) {
            const childDefaultTag = key === 'options' ? 'option' : null;
            for (const child of obj[key]) {
                childrenContent += objToXml(child, indent + 1, childDefaultTag);
            }
        }
    }

    if (childrenContent) {
        return `${indentStr}<${tagName}${attributes}>\n${childrenContent}${indentStr}</${tagName}>\n`;
    } else {
        return `${indentStr}<${tagName}${attributes}></${tagName}>\n`;
    }
}
