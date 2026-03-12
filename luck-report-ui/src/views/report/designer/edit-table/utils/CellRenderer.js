/**
 * Created by Jacky.Gao on 2017-01-31.
 */
import {$t} from "@/locales";
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';
import ChartWidget from '@/views/report/designer/edit-table/chart-widget/class.js';
import chartWidgetManager from '@/views/report/designer/edit-table/chart-widget/manager.js';
import CrossTabWidgetManager from '@/views/report/designer/edit-table/cross-tab-widget/manager.js';
import imageIcon from '@/assets/icons/image.svg';
import qrcodeIcon from '@/assets/icons/qrcode.svg';
import barcodeIcon from '@/assets/icons/barcode.svg';
import exprExpandDownIcon from '@/assets/icons/expr-expand-down.svg';
import expandDownIcon from '@/assets/icons/expand-down.svg';
import exprExpandRightIcon from '@/assets/icons/expr-expand-right.svg';
import expandRightIcon from '@/assets/icons/expand-right.svg';
import propertyIcon from '@/assets/icons/property.svg';
import expressionIcon from '@/assets/icons/expression.svg';
import {getCell} from "@/utils/contextActions";

export function afterRenderer(td,row,col,prop,value,cellProperties){
    if(!this.context){
        return;
    }
    let cellDef = getCell(row,col);
    if(!cellDef){
        return;
    }

    const cellStyle = cellDef.cellStyle;
    const cellValue = cellDef.value;
    const valueType = cellValue.type;
    let tip='';
    if(valueType==='dataset'){
        tip = cellValue.datasetName + "." + cellValue.aggregate + "(";
        let prop = cellValue.property;
        tip += prop + ")";
        if (td.innerHTML === '') {
            td.innerHTML = tip;
        }
    }else if(valueType==='expression'){
        tip = cellValue.value || '';
        if (td.innerHTML === '') {
            td.innerHTML = tip;
        }
    }else if(valueType==='image'){
        tip = $t('table.render.image') + cellValue.value;
        const imagePath = imageIcon;
        const image = document.createElement('img');
        image.src = imagePath;
        image.width = 20;
        emptyElement(td);
        td.appendChild(image);
    }else if(valueType==='slash'){
        tip = $t('table.render.slash');
        const widgetKey = `${row}_${col}`;
        const slashNames = (cellValue.slashes || []).map(s => s.text);
        const valueString = slashNames.join('|');
        if(!CrossTabWidgetManager.has(widgetKey)){
            CrossTabWidgetManager.set(widgetKey, new CrossTabWidget(this.context, row, col, valueString));
        } else {
            const widget = CrossTabWidgetManager.get(widgetKey);
            widget.value = valueString;
            widget.refreshCell();
        }
    }else if(valueType==='zxing'){
        let imagePath = qrcodeIcon;
        tip = $t('table.render.qrcode');
        if (cellValue.category === 'barcode') {
            tip = $t('table.render.barcode');
            imagePath = barcodeIcon;
        }
        const width = cellValue.width, height = cellValue.height;
        const image = document.createElement('img');
        image.src = imagePath;
        image.width = width;
        image.height = height;
        emptyElement(td);
        td.appendChild(image);
    }else if(valueType==='chart'){
        tip = $t('table.render.chart');
        const widgetKey = `${row}_${col}`;
        if(!chartWidgetManager.has(widgetKey)){
            chartWidgetManager.set(widgetKey, new ChartWidget(td, row, col));
        }
        chartWidgetManager.get(widgetKey).renderChart(td, this.context, row, col);
    }else{
        tip = cellValue.value || "";
        if (td.innerHTML === '') {
            td.innerHTML = tip;
        }
    }
    td.title = tip;

    if (valueType === "simple") {
        let text = td.textContent;
        if (text && text !== "") {
            text = text.replace(new RegExp('<', 'gm'), '&lt;');
            text = text.replace(new RegExp('>', 'gm'), '&gt;');
            text = text.replace(new RegExp('\r\n', 'gm'), '<br>');
            text = text.replace(new RegExp('\n', 'gm'), '<br>');
            text = text.replace(new RegExp(' ', 'gm'), '&nbsp;');
            td.innerHTML = text;
        }
    }

    setStyles(td, {
        'word-break': 'break-all',
        'line-height': 'normal',
        'white-space': 'nowrap',
        'padding': '0 1px'
    });

    if (cellDef.expand === 'Down') {
        let url = exprExpandDownIcon;
        if (valueType === 'dataset') {
            url = expandDownIcon;
        }
        prependHtml(td, `<image src="${url}"></image>`);
    } else if (cellDef.expand === 'Right') {
        let url = exprExpandRightIcon;
        if (valueType === 'dataset') {
            url = expandRightIcon;
        }
        prependHtml(td, `<image src="${url}" style="display: block;"></image>`);
    } else {
        if (valueType === 'dataset') {
            let url = propertyIcon;
            prependHtml(td, `<image src="${url}" style="display: inline-block;"></image>`);
        } else if (valueType === 'expression') {
            let url = expressionIcon;
            prependHtml(td, `<image src="${url}" style="display: inline-block;"></image>`);
        }
    }

    if (cellStyle.align) {
        td.style.textAlign = cellStyle.align;
    }
    if (cellStyle.valign) {
        td.style.verticalAlign = cellStyle.valign;
    }
    if (cellStyle.bold) {
        td.style.fontWeight = 'bold';
    }
    if (cellStyle.italic) {
        td.style.fontStyle = 'italic';
    }
    if (cellStyle.underline) {
        td.style.textDecoration = 'underline';
    }
    if (cellStyle.forecolor) {
        td.style.color = "rgb(" + cellStyle.forecolor + ")";
    }
    if (cellStyle.bgcolor) {
        td.style.backgroundColor = "rgb(" + cellStyle.bgcolor + ")";
    }
    if (cellStyle.fontSize) {
        td.style.fontSize = cellStyle.fontSize + "pt";
    }
    if (cellStyle.fontFamily) {
        td.style.fontFamily = cellStyle.fontFamily;
    }
    if (cellStyle.lineHeight) {
        td.style.lineHeight = cellStyle.lineHeight;
    } else {
        td.style.lineHeight = '';
    }

    const leftBorder = cellStyle.leftBorder;
    if (leftBorder) {
        if (leftBorder === '' || leftBorder.style === "none") {
            td.style.borderLeft = '';
        } else {
            let borderStyle = 'double';
            let borderWidth = leftBorder.width;
            if (borderWidth === null || borderWidth === undefined || borderWidth === '') {
                borderWidth = 0;
            } else {
                borderWidth = parseInt(borderWidth);
            }
            if (leftBorder.style !== 'solid' && borderWidth > 0) {
                borderStyle = leftBorder.style;
                borderWidth++;
            }
            let style = borderStyle + " " + borderWidth + "px rgb(" + leftBorder.color + ")";
            td.style.borderLeft = style;
        }
    }

    const rightBorder = cellStyle.rightBorder;
    if (rightBorder) {
        if (rightBorder === '' || rightBorder.style === "none") {
            td.style.borderRight = '';
        } else {
            let style = rightBorder.style + " " + rightBorder.width + "px rgb(" + rightBorder.color + ")";
            td.style.borderRight = style;
        }
    }

    const topBorder = cellStyle.topBorder;
    if (topBorder) {
        if (topBorder === '' || topBorder.style === "none") {
            td.style.borderTop = '';
        } else {
            let borderStyle = 'double';
            let borderWidth = topBorder.width;
            if (borderWidth === null || borderWidth === undefined || borderWidth === '') {
                borderWidth = 0;
            } else {
                borderWidth = parseInt(borderWidth);
            }
            if (topBorder.style !== 'solid' && borderWidth > 0) {
                borderStyle = topBorder.style;
                borderWidth++;
            }
            let style = borderStyle + " " + borderWidth + "px rgb(" + topBorder.color + ")";
            td.style.borderTop = style;
        }
    }

    const bottomBorder = cellStyle.bottomBorder;
    if (bottomBorder) {
        if (bottomBorder === '' || bottomBorder.style === "none") {
            td.style.borderBottom = '';
        } else {
            let style = bottomBorder.style + " " + bottomBorder.width + "px rgb(" + bottomBorder.color + ")";
            td.style.borderBottom = style;
        }
    }
};

// 辅助函数：设置元素样式
function setStyles(element, styles) {
    for (let key in styles) {
        if (styles.hasOwnProperty(key)) {
            element.style[key] = styles[key];
        }
    }
}

// 辅助函数：清空元素内容
function emptyElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// 辅助函数：在元素前插入HTML
function prependHtml(element, html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
        element.insertBefore(temp.firstChild, element.firstChild);
    }
}
