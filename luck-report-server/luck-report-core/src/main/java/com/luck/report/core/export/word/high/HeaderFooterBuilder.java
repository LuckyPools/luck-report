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
package com.luck.report.core.export.word.high;

import com.luck.report.core.definition.HeaderFooterDefinition;
import com.luck.report.core.model.Report;
import org.apache.commons.lang.StringUtils;
import org.apache.poi.wp.usermodel.HeaderFooterType;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFFooter;
import org.apache.poi.xwpf.usermodel.XWPFHeader;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Word页眉页脚构建器
 * @author Jacky.gao
 * @since 2017年4月17日
 */
public class HeaderFooterBuilder {

    /**
     * 构建Word文档的页眉页脚
     * @param document Word文档对象
     * @param sectPr 节属性
     * @param report 报表对象
     */
    public void build(XWPFDocument document, CTSectPr sectPr, Report report) {
        HeaderFooterDefinition headerDef = report.getHeader();
        HeaderFooterDefinition footerDef = report.getFooter();

        SimpleDateFormat dateSD = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat timeSD = new SimpleDateFormat("HH:mm:ss");
        Date D = new Date();
        String date = dateSD.format(D);
        String time = timeSD.format(D);

        if (headerDef != null) {
            XWPFHeader header = document.createHeader(HeaderFooterType.DEFAULT);
            buildHeaderFooterContent(header, headerDef, date, time);
        }
        if (footerDef != null) {
            XWPFFooter footer = document.createFooter(HeaderFooterType.DEFAULT);
            buildHeaderFooterContent(footer, footerDef, date, time);
        }
    }

    /**
     * 构建页眉页脚内容
     * @param headerFooter 页眉或页脚对象
     * @param def 页眉页脚定义
     * @param date 日期字符串
     * @param time 时间字符串
     */
    private void buildHeaderFooterContent(Object headerFooter, HeaderFooterDefinition def, String date, String time) {
        String left = def.getLeft();
        String center = def.getCenter();
        String right = def.getRight();

        if (StringUtils.isNotBlank(left)) {
            XWPFParagraph para = createParagraph(headerFooter);
            para.setAlignment(ParagraphAlignment.LEFT);
            buildParagraphContent(para, left, def, date, time);
        }
        if (StringUtils.isNotBlank(center)) {
            XWPFParagraph para = createParagraph(headerFooter);
            para.setAlignment(ParagraphAlignment.CENTER);
            buildParagraphContent(para, center, def, date, time);
        }
        if (StringUtils.isNotBlank(right)) {
            XWPFParagraph para = createParagraph(headerFooter);
            para.setAlignment(ParagraphAlignment.RIGHT);
            buildParagraphContent(para, right, def, date, time);
        }
    }

    /**
     * 在页眉或页脚中创建段落
     * @param headerFooter 页眉或页脚对象
     * @return 段落对象
     */
    private XWPFParagraph createParagraph(Object headerFooter) {
        if (headerFooter instanceof XWPFHeader) {
            return ((XWPFHeader) headerFooter).createParagraph();
        } else if (headerFooter instanceof XWPFFooter) {
            return ((XWPFFooter) headerFooter).createParagraph();
        }
        throw new IllegalArgumentException("headerFooter must be XWPFHeader or XWPFFooter");
    }

    /**
     * 构建段落内容，处理页码域等特殊占位符
     * @param para 段落对象
     * @param content 内容字符串
     * @param def 页眉页脚定义
     * @param date 日期字符串
     * @param time 时间字符串
     */
    private void buildParagraphContent(XWPFParagraph para, String content, HeaderFooterDefinition def, String date, String time) {
        content = convertToPlaceholder(content);

        List<String> list = splitHeaderFooterContent(content);
        for (String text : list) {
            XWPFRun run = para.createRun();
            if (text.equals("$[PAGE]")) {
                para.getCTP().addNewFldSimple().setInstr("PAGE \\* MERGEFORMAT");
            } else if (text.equals("$[PAGES]")) {
                para.getCTP().addNewFldSimple().setInstr("NUMPAGES \\* MERGEFORMAT");
            } else if (text.equals("$[DATE]")) {
                run.setText(date);
            } else if (text.equals("$[TIME]")) {
                run.setText(time);
            } else {
                run.setText(text);
            }
            setStyle(run, def);
        }
    }

    /**
     * 将报表表达式转换为占位符
     * 例如: "第"+page()+"页,共"+pages()+"页" -> "第$[PAGE]页,共$[PAGES]页"
     * @param content 原始内容
     * @return 转换后的内容
     */
    private String convertToPlaceholder(String content) {
        if (StringUtils.isBlank(content)) {
            return content;
        }
        String result = content;
        result = result.replaceAll("\"\\s*\\+\\s*page\\(\\)\\s*\\+\\s*\"", "\\$[PAGE]");
        result = result.replaceAll("\"\\s*\\+\\s*pages\\(\\)\\s*\\+\\s*\"", "\\$[PAGES]");
        result = result.replace("page()", "$[PAGE]");
        result = result.replace("pages()", "$[PAGES]");
        result = result.replace("\"", "");
        return result;
    }

    /**
     * 设置文本样式
     * @param run 文本运行对象
     * @param def 页眉页脚定义
     */
    private void setStyle(XWPFRun run, HeaderFooterDefinition def) {
        if (def.getFontSize() > 1) {
            run.setFontSize(def.getFontSize());
        }
        CTRPr rpr = run.getCTR().isSetRPr() ? run.getCTR().getRPr() : run.getCTR().addNewRPr();
        CTFonts font = null;
        CTFonts[] fonts = rpr.getRFontsArray();
        if (fonts == null || fonts.length == 0) {
            font = rpr.addNewRFonts();
        } else {
            font = fonts[0];
        }
        String fontName = def.getFontFamily();
        if (fontName != null) {
            font.setAscii(fontName);
            font.setEastAsia(fontName);
            font.setHAnsi(fontName);
        }
        if (def.isBold()) {
            run.setBold(true);
        }
        if (def.isItalic()) {
            run.setItalic(true);
        }
        String forecolor = def.getForecolor();
        if (StringUtils.isNotBlank(forecolor)) {
            run.setColor(toHex(forecolor.split(",")));
        }
    }

    /**
     * 将RGB颜色值转换为十六进制字符串
     * @param rgb RGB颜色数组，如 ["255", "0", "0"]
     * @return 十六进制颜色字符串，如 "FF0000"
     */
    private String toHex(String rgb[]) {
        String R = Integer.toHexString(Integer.valueOf(rgb[0]));
        String G = Integer.toHexString(Integer.valueOf(rgb[1]));
        String B = Integer.toHexString(Integer.valueOf(rgb[2]));
        R = R.length() == 1 ? "0" + R : R;
        G = G.length() == 1 ? "0" + G : G;
        B = B.length() == 1 ? "0" + B : B;
        return (R + G + B).toUpperCase();
    }

    /**
     * 分割页眉页脚内容，识别占位符
     * @param info 原始内容
     * @return 分割后的内容列表
     */
    private List<String> splitHeaderFooterContent(String info) {
        Pattern pattern = Pattern.compile("\\$\\[PAGE\\]|\\$\\[PAGES\\]|\\$\\[DATE\\]|\\$\\[TIME\\]");
        Matcher matcher = pattern.matcher(info);
        List<String> list = new ArrayList<String>();
        int start = 0;
        while (matcher.find()) {
            String text = matcher.group();
            int pos = info.indexOf(text);
            String str = info.substring(start, pos);
            start = pos + text.length();
            list.add(str);
            list.add(text);
        }
        if (start < info.length()) {
            list.add(info.substring(start, info.length()));
        }
        return list;
    }

}
