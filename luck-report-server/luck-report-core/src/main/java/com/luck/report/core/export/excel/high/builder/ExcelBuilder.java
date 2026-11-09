/*******************************************************************************
 * Copyright 2017 Bstek
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
package com.luck.report.core.export.excel.high.builder;

import com.luck.report.core.definition.Orientation;
import com.luck.report.core.definition.Paper;
import com.luck.report.core.definition.PaperType;
import com.luck.report.core.model.Column;
import com.luck.report.core.model.Image;
import com.luck.report.core.model.Row;
import com.luck.report.core.utils.ImageUtils;
import com.luck.report.core.utils.UnitUtils;
import org.apache.commons.io.IOUtils;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.PageMargin;
import org.apache.poi.ss.usermodel.PaperSize;
import org.apache.poi.ss.usermodel.PrintOrientation;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.util.Units;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFClientAnchor;
import org.apache.poi.xssf.usermodel.XSSFPrintSetup;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.List;

/**
 * @author Jacky.gao
 * @since 2017年8月10日
 */
public abstract class ExcelBuilder {

    protected int getWholeWidth(List<Column> columns, int colNumber, int colSpan) {
        Column col = columns.get(colNumber);
        int start = colNumber + 1, end = colNumber + colSpan;
        int w = col.getWidth();
        for (int i = start; i < end; i++) {
            Column c = columns.get(i);
            w += c.getWidth();
        }
        w = UnitUtils.pointToPixel(w);
        return w;
    }

    protected int getWholeHeight(List<Row> rows, int rowNumber, int rowSpan) {
        Row row = rows.get(rowNumber);
        int start = rowNumber + 1, end = rowNumber + rowSpan;
        int h = row.getRealHeight();
        for (int i = start; i < end; i++) {
            Row r = rows.get(i);
            h += r.getRealHeight();
        }
        h = UnitUtils.pointToPixel(h);
        return h;
    }

    protected Sheet createSheet(SXSSFWorkbook wb, Paper paper, String name) {
        Sheet sheet = null;
        if (name == null) {
            sheet = wb.createSheet();
        } else {
            sheet = wb.createSheet(name);
        }
        PaperType paperType = paper.getPaperType();
        XSSFPrintSetup printSetup = (XSSFPrintSetup) sheet.getPrintSetup();
        Orientation orientation = paper.getOrientation();
        if (orientation.equals(Orientation.landscape)) {
            printSetup.setOrientation(PrintOrientation.LANDSCAPE);
        }
        setupPaper(paperType, printSetup);
        int leftMargin = paper.getLeftMargin();
        int rightMargin = paper.getRightMargin();
        int topMargin = paper.getTopMargin();
        int bottomMargin = paper.getBottomMargin();
        sheet.setMargin(PageMargin.LEFT, UnitUtils.pointToInche(leftMargin));
        sheet.setMargin(PageMargin.RIGHT, UnitUtils.pointToInche(rightMargin));
        sheet.setMargin(PageMargin.TOP, UnitUtils.pointToInche(topMargin));
        sheet.setMargin(PageMargin.BOTTOM, UnitUtils.pointToInche(bottomMargin));
        return sheet;
    }

    protected int buildImageFormat(Image img) {
        int type = Workbook.PICTURE_TYPE_PNG;
        String path = img.getPath();
        if (path == null) {
            return type;
        }
        path = path.toLowerCase();
        if (path.endsWith("jpg") || path.endsWith("jpeg")) {
            type = Workbook.PICTURE_TYPE_JPEG;
        }
        return type;
    }

    /**
     * 将单元格图片写入 Excel。锚点采用「起止单元格 + 四边边距」：
     * dx2/dy2 为相对终止格的负边距，避免图片小于单元格时出现负 extent 导致不可见。
     *
     * @param drawing       绘图对象
     * @param wb            工作簿
     * @param img           图片
     * @param excelCol      起始列（0 基）
     * @param excelRow      起始行（0 基）
     * @param colSpan       列合并数，0/1 表示单列
     * @param rowSpan       行合并数，0/1 表示单行
     * @param wholeWidthPx  合并区宽度（px）
     * @param wholeHeightPx 合并区高度（px）
     * @param align         水平对齐
     * @param valign        垂直对齐
     */
    protected void addCellImage(Drawing<?> drawing, SXSSFWorkbook wb, Image img,
                                int excelCol, int excelRow, int colSpan, int rowSpan,
                                int wholeWidthPx, int wholeHeightPx,
                                HorizontalAlignment align, VerticalAlignment valign) throws Exception {
        InputStream inputStream = ImageUtils.base64DataToInputStream(img.getBase64Data());
        BufferedImage bufferedImage;
        try {
            bufferedImage = ImageIO.read(inputStream);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
        if (bufferedImage == null) {
            return;
        }
        int[] drawSize = ImageUtils.resolveExportSize(img, bufferedImage);
        int drawW = drawSize[0];
        int drawH = drawSize[1];
        if (wholeWidthPx > 0 && wholeHeightPx > 0) {
            double scale = Math.min(1.0, Math.min((double) wholeWidthPx / (double) drawW,
                    (double) wholeHeightPx / (double) drawH));
            drawW = Math.max(1, (int) Math.round(drawW * scale));
            drawH = Math.max(1, (int) Math.round(drawH * scale));
        }
        int leftMargin = 0;
        int topMargin = 0;
        if (align != null && align.equals(HorizontalAlignment.CENTER)) {
            leftMargin = Math.max(0, (wholeWidthPx - drawW) / 2);
        } else if (align != null && align.equals(HorizontalAlignment.RIGHT)) {
            leftMargin = Math.max(0, wholeWidthPx - drawW);
        }
        if (valign != null && valign.equals(VerticalAlignment.CENTER)) {
            topMargin = Math.max(0, (wholeHeightPx - drawH) / 2);
        } else if (valign != null && valign.equals(VerticalAlignment.BOTTOM)) {
            topMargin = Math.max(0, wholeHeightPx - drawH);
        }
        int rightMargin = Math.max(0, wholeWidthPx - leftMargin - drawW);
        int bottomMargin = Math.max(0, wholeHeightPx - topMargin - drawH);
        int spanCols = colSpan > 0 ? colSpan : 1;
        int spanRows = rowSpan > 0 ? rowSpan : 1;

        inputStream = ImageUtils.base64DataToInputStream(img.getBase64Data());
        try {
            byte[] bytes = IOUtils.toByteArray(inputStream);
            int pictureIndex = wb.addPicture(bytes, buildImageFormat(img));
            XSSFClientAnchor anchor = new XSSFClientAnchor();
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_DONT_RESIZE);
            anchor.setCol1(excelCol);
            anchor.setRow1(excelRow);
            anchor.setCol2(excelCol + spanCols);
            anchor.setRow2(excelRow + spanRows);
            anchor.setDx1(Units.pixelToEMU(leftMargin));
            anchor.setDx2(-Units.pixelToEMU(rightMargin));
            anchor.setDy1(Units.pixelToEMU(topMargin));
            anchor.setDy2(-Units.pixelToEMU(bottomMargin));
            drawing.createPicture(anchor, pictureIndex);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    protected boolean setupPaper(PaperType paperType, XSSFPrintSetup printSetup) {
        boolean setup = false;
        switch (paperType) {
            case A0:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A1:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A2:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A3:
                printSetup.setPaperSize(PaperSize.A3_PAPER);
                setup = true;
                break;
            case A4:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                setup = true;
                break;
            case A5:
                printSetup.setPaperSize(PaperSize.A5_PAPER);
                setup = true;
                break;
            case A6:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A7:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A8:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A9:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case A10:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B0:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B1:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B2:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B3:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B4:
                printSetup.setPaperSize(PaperSize.B4_PAPER);
                setup = true;
                break;
            case B5:
                printSetup.setPaperSize(PaperSize.B4_PAPER);
                setup = true;
                break;
            case B6:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B7:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B8:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B9:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case B10:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
            case CUSTOM:
                printSetup.setPaperSize(PaperSize.A4_PAPER);
                break;
        }
        return setup;
    }
}
