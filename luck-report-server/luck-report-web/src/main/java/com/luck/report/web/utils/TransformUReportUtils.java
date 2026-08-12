package com.luck.report.web.utils;

import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.OutputFormat;
import org.dom4j.io.SAXReader;
import org.dom4j.io.XMLWriter;

import java.io.File;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 报表转化工具 将 UReport2 的报表转化为适配当前设计器的版本
 * @author luck
 */
public class TransformUReportUtils {

    private static int fieldCounter = 100;

    public static void main(String[] args) {
        transformXmlFile("E:\\luckStudio\\IO\\report\\测试v1报表-参数.ureport.xml","E:\\luckStudio\\IO\\report\\测试");
        //transformXmlFolder("D:\\report\\","E:\\luckStudio\\IO\\report\\测试\\");
    }

    /**
     * 将 UReport2 的报表转化为适配当前设计器的版本
     * @param inputFolderPath 原文件夹路径
     * @param outputFolderPath 目标文件夹路径
     */
    public static void transformXmlFolder(String inputFolderPath, String outputFolderPath) {
        File inputFolder = new File(inputFolderPath);
        if (!inputFolder.exists() || !inputFolder.isDirectory()) {
            throw new RuntimeException("输入文件夹不存在或不是目录: " + inputFolderPath);
        }

        File outputFolder = new File(outputFolderPath);
        if (!outputFolder.exists()) {
            outputFolder.mkdirs();
        }

        processFolder(inputFolder, outputFolder);
    }

    /**
     * 转化文件夹中的xml
     * @param inputFolder
     * @param outputFolder
     */
    private static void processFolder(File inputFolder, File outputFolder) {
        File[] files = inputFolder.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                File newOutputFolder = new File(outputFolder, file.getName());
                if (!newOutputFolder.exists()) {
                    newOutputFolder.mkdirs();
                }
                processFolder(file, newOutputFolder);
            } else if (file.isFile() && file.getName().toLowerCase().endsWith(".xml")) {
                try {
                    transformXmlFile(file.getAbsolutePath(), outputFolder.getAbsolutePath());
                } catch (Exception e) {
                    System.err.println("转换文件失败: " + file.getAbsolutePath() + ", 错误: " + e.getMessage());
                }
            }
        }
    }

    /**
     * 转化xml文件
     * @param inputFilePath 输入XML文件的完整路径
     * @param outputDirPath 输出目录路径，如果目录不存在会自动创建
     */
    public static void transformXmlFile(String inputFilePath, String outputDirPath) {
        try {
            File inputFile = new File(inputFilePath);
            if (!inputFile.exists()) {
                throw new RuntimeException("输入文件不存在: " + inputFilePath);
            }

            SAXReader reader = new SAXReader();
            Document oldDoc = reader.read(inputFile);
            Element oldRoot = oldDoc.getRootElement();

            Element searchFormElement = oldRoot.element("search-form");
            if (searchFormElement != null) {
                Element formElement = DocumentHelper.createElement("form");
                transformSearchForm(searchFormElement, formElement);

                int index = oldRoot.indexOf(searchFormElement);
                oldRoot.remove(searchFormElement);
                oldRoot.elements().add(index, formElement);
            }

            // 转换 SQL 参数占位符：:paramName → #{paramName}
            transformSqlElements(oldRoot);

            String fileName = inputFile.getName();
            File outputDir = new File(outputDirPath);
            if (!outputDir.exists()) {
                outputDir.mkdirs();
            }

            File outputFile = new File(outputDir, fileName);
            OutputFormat format = OutputFormat.createPrettyPrint();
            format.setEncoding("UTF-8");
            FileOutputStream fos = new FileOutputStream(outputFile);
            XMLWriter xmlWriter = new XMLWriter(fos, format);
            xmlWriter.write(oldDoc);
            xmlWriter.close();
            fos.close();

            System.out.println("转换成功，文件已保存到: " + outputFile.getAbsolutePath());
        } catch (Exception e) {
            throw new RuntimeException("XML文件转换失败", e);
        }
    }

    /**
     * 转换search-form元素为form元素
     * 设置form标签的必要属性，并转换所有子grid元素为row元素
     *
     * @param oldForm 原版search-form元素
     * @param newForm 新版form元素
     */
    private static void transformSearchForm(Element oldForm, Element newForm) {
        newForm.addAttribute("formRef", "uForm");
        newForm.addAttribute("tag", "u-form");
        newForm.addAttribute("formModel", "formData");
        newForm.addAttribute("size", "medium");
        newForm.addAttribute("labelPosition", "right");
        newForm.addAttribute("labelWidth", "100");
        newForm.addAttribute("formRules", "rules");
        newForm.addAttribute("gutter", "15");
        newForm.addAttribute("disabled", "false");
        newForm.addAttribute("span", "24");
        newForm.addAttribute("formBtns", "true");

        List<Element> oldGrids = oldForm.elements("grid");
        for (Element oldGrid : oldGrids) {
            Element newRow = newForm.addElement("row");
            transformGrid(oldGrid, newRow);
        }
    }

    /**
     * 转换grid元素为row元素
     * 设置row标签的必要属性，并转换所有子col元素
     *
     * @param oldGrid 原版grid元素
     * @param newRow 新版row元素
     */
    private static void transformGrid(Element oldGrid, Element newRow) {
        newRow.addAttribute("layout", "rowFormItem");
        newRow.addAttribute("tagIcon", "row");
        newRow.addAttribute("type", "default");
        newRow.addAttribute("tag", "u-row");
        newRow.addAttribute("justify", "start");
        newRow.addAttribute("align", "top");
        newRow.addAttribute("layoutTree", "true");
        newRow.addAttribute("document", "/component/layout");
        newRow.addAttribute("span", "24");
        newRow.addAttribute("gutter", "15");

        String gridType = oldGrid.attributeValue("type");
        String formId = generateFormId();
        newRow.addAttribute("formId", formId);
        newRow.addAttribute("renderKey", generateRenderKey());
        newRow.addAttribute("componentName", "row" + formId);

        String borderWidth = oldGrid.attributeValue("border-width");
        if (borderWidth != null && !borderWidth.isEmpty()) {
            try {
                int gutter = Integer.parseInt(borderWidth);
                newRow.addAttribute("gutter", String.valueOf(gutter));
            } catch (NumberFormatException e) {
            }
        }

        List<Element> oldCols = oldGrid.elements("col");
        for (Element oldCol : oldCols) {
            transformCol(oldCol, newRow);
        }
    }

    /**
     * 转换col元素
     * 遍历col的所有子元素，如果是grid则递归转换为row，否则转换为对应的新版组件
     *
     * @param oldCol 原版col元素
     * @param parentRow 父级row元素，新组件将添加到此元素中
     */
    private static void transformCol(Element oldCol, Element parentRow) {
        String size = oldCol.attributeValue("size");
        List<Element> children = oldCol.elements();

        for (Element child : children) {
            String tagName = child.getName();

            if (tagName.equals("grid")) {
                Element nestedRow = parentRow.addElement("row");
                transformGrid(child, nestedRow);
            } else {
                String newTagName = mapComponentTag(tagName);

                if (newTagName != null) {
                    Element newComponent = parentRow.addElement(newTagName);
                    transformComponent(child, newComponent, size);
                }
            }
        }
    }

    /**
     * 转换组件元素
     * 根据组件类型调用对应的转换方法，忽略按钮组件
     *
     * @param oldComponent 原版组件元素
     * @param newComponent 新版组件元素
     * @param colSize col的size属性值，用于设置组件的span
     */
    private static void transformComponent(Element oldComponent, Element newComponent, String colSize) {
        String tagName = oldComponent.getName();

        if (tagName.equals("button-submit") || tagName.equals("button-reset")) {
            return;
        }

        Map<String, String> commonAttributes = new HashMap<>();
        commonAttributes.put("label", oldComponent.attributeValue("label"));
        commonAttributes.put("span", colSize != null ? colSize : "24");
        commonAttributes.put("labelWidth", "null");
        commonAttributes.put("disabled", "false");
        commonAttributes.put("required", "true");
        commonAttributes.put("regList", "[]");
        commonAttributes.put("changeTag", "true");
        commonAttributes.put("layout", "colFormItem");

        String formId = generateFormId();
        commonAttributes.put("formId", formId);
        commonAttributes.put("renderKey", generateRenderKey());

        String vModel = "field" + fieldCounter++;
        commonAttributes.put("vModel", vModel);

        switch (tagName) {
            case "input-text":
                transformInputText(oldComponent, newComponent, commonAttributes);
                break;
            case "input-datetime":
                transformInputDatetime(oldComponent, newComponent, commonAttributes);
                break;
            case "input-radio":
                transformInputRadio(oldComponent, newComponent, commonAttributes);
                break;
            case "input-checkbox":
                transformInputCheckbox(oldComponent, newComponent, commonAttributes);
                break;
            case "input-select":
                transformInputSelect(oldComponent, newComponent, commonAttributes);
                break;
            default:
                transformGeneric(oldComponent, newComponent, commonAttributes);
        }
    }

    /**
     * 转换input-text组件为input组件
     * 设置文本输入框的必要属性和样式
     *
     * @param oldComponent 原版input-text元素
     * @param newComponent 新版input元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformInputText(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tag", "u-input");
        newComponent.addAttribute("tagIcon", "input");
        newComponent.addAttribute("placeholder", "请输入" + (oldComponent.attributeValue("label") != null ? oldComponent.attributeValue("label") : ""));
        newComponent.addAttribute("style", "{\"width\":\"100%\"}");
        newComponent.addAttribute("clearable", "true");
        newComponent.addAttribute("prepend", "");
        newComponent.addAttribute("append", "");
        newComponent.addAttribute("prefixIcon", "");
        newComponent.addAttribute("suffixIcon", "");
        newComponent.addAttribute("maxlength", "null");
        newComponent.addAttribute("showWordLimit", "false");
        newComponent.addAttribute("readonly", "false");
        newComponent.addAttribute("defaultValue", "null");
        newComponent.addAttribute("document", "/component/input");

        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }
    }

    /**
     * 转换input-datetime组件为date-picker组件
     * 设置日期选择器的必要属性，转换日期格式
     *
     * @param oldComponent 原版input-datetime元素
     * @param newComponent 新版date-picker元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformInputDatetime(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tag", "u-date-picker");
        newComponent.addAttribute("tagIcon", "date");
        newComponent.addAttribute("placeholder", "请选择" + (oldComponent.attributeValue("label") != null ? oldComponent.attributeValue("label") : ""));
        newComponent.addAttribute("defaultValue", "null");
        newComponent.addAttribute("type", "date");
        newComponent.addAttribute("style", "{\"width\":\"100%\"}");
        newComponent.addAttribute("clearable", "true");
        newComponent.addAttribute("readonly", "false");
        newComponent.addAttribute("format", "YYYY-MM-DD");
        newComponent.addAttribute("valueFormat", "format");
        newComponent.addAttribute("document", "/component/date-picker");

        String oldFormat = oldComponent.attributeValue("format");
        if (oldFormat != null && !oldFormat.isEmpty()) {
            newComponent.addAttribute("format", convertDateFormat(oldFormat));
        }

        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }
    }

    /**
     * 转换input-radio组件为radio-group组件
     * 设置单选框组的必要属性，转换所有option子元素
     *
     * @param oldComponent 原版input-radio元素
     * @param newComponent 新版radio-group元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformInputRadio(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tag", "u-radio-group");
        newComponent.addAttribute("tagIcon", "radio");
        newComponent.addAttribute("style", "{}");
        newComponent.addAttribute("optionType", "default");
        newComponent.addAttribute("border", "false");
        newComponent.addAttribute("size", "medium");
        newComponent.addAttribute("defaultValue", "false");
        newComponent.addAttribute("document", "/component/radio");

        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }

        List<Element> options = oldComponent.elements("option");
        for (Element option : options) {
            Element newOption = newComponent.addElement("option");
            newOption.addAttribute("label", option.attributeValue("label"));
            newOption.addAttribute("value", option.attributeValue("value"));
        }
    }

    /**
     * 转换input-checkbox组件为checkbox-group组件
     * 设置复选框组的必要属性，转换所有option子元素
     *
     * @param oldComponent 原版input-checkbox元素
     * @param newComponent 新版checkbox-group元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformInputCheckbox(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tag", "u-checkbox-group");
        newComponent.addAttribute("tagIcon", "checkbox");
        newComponent.addAttribute("defaultValue", "[]");
        newComponent.addAttribute("style", "{}");
        newComponent.addAttribute("optionType", "default");
        newComponent.addAttribute("border", "false");
        newComponent.addAttribute("size", "medium");
        newComponent.addAttribute("document", "/component/checkbox");

        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }

        List<Element> options = oldComponent.elements("option");
        for (Element option : options) {
            Element newOption = newComponent.addElement("option");
            newOption.addAttribute("label", option.attributeValue("label"));
            newOption.addAttribute("value", option.attributeValue("value"));
        }
    }

    /**
     * 转换input-select组件为select组件
     * 设置下拉选择框的必要属性，转换所有option子元素
     *
     * @param oldComponent 原版input-select元素
     * @param newComponent 新版select元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformInputSelect(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tag", "u-select");
        newComponent.addAttribute("tagIcon", "select");
        newComponent.addAttribute("placeholder", "请选择" + (oldComponent.attributeValue("label") != null ? oldComponent.attributeValue("label") : ""));
        newComponent.addAttribute("style", "{}");
        newComponent.addAttribute("clearable", "true");
        newComponent.addAttribute("filterable", "false");
        newComponent.addAttribute("multiple", "false");
        newComponent.addAttribute("defaultValue", "null");
        newComponent.addAttribute("document", "/component/select");

        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }

        List<Element> options = oldComponent.elements("option");
        for (Element option : options) {
            Element newOption = newComponent.addElement("option");
            newOption.addAttribute("label", option.attributeValue("label"));
            newOption.addAttribute("value", option.attributeValue("value"));
        }
    }

    /**
     * 通用组件转换方法
     * 为不支持的组件类型添加通用属性
     *
     * @param oldComponent 原版组件元素
     * @param newComponent 新版组件元素
     * @param commonAttributes 通用属性集合
     */
    private static void transformGeneric(Element oldComponent, Element newComponent, Map<String, String> commonAttributes) {
        newComponent.addAttribute("tagIcon", "input");
        for (Map.Entry<String, String> entry : commonAttributes.entrySet()) {
            newComponent.addAttribute(entry.getKey(), entry.getValue());
        }
    }

    /**
     * 映射原版组件标签名为新版组件标签名
     *
     * @param oldTag 原版组件标签名
     * @return 新版组件标签名，如果不支持则返回null
     */
    private static String mapComponentTag(String oldTag) {
        switch (oldTag) {
            case "input-text":
                return "input";
            case "input-datetime":
                return "date-picker";
            case "input-radio":
                return "radio-group";
            case "input-checkbox":
                return "checkbox-group";
            case "input-select":
                return "select";
            default:
                return null;
        }
    }

    /**
     * 转换日期格式
     * 将原版日期格式（yyyy-mm-dd）转换为新版日期格式（YYYY-MM-DD）
     *
     * @param oldFormat 原版日期格式字符串
     * @return 新版日期格式字符串
     */
    private static String convertDateFormat(String oldFormat) {
        if (oldFormat == null) {
            return "YYYY-MM-DD";
        }
        switch (oldFormat.toLowerCase()) {
            case "yyyy-mm-dd":
                return "YYYY-MM-DD";
            case "yyyy-mm-dd hh:mm:ss":
                return "YYYY-MM-DD HH:mm:ss";
            case "hh:mm:ss":
                return "HH:mm:ss";
            default:
                return "YYYY-MM-DD";
        }
    }

    /**
     * 生成随机的formId
     * 用于唯一标识表单组件
     *
     * @return 3位随机数字字符串
     */
    private static String generateFormId() {
        return String.valueOf(100 + (int)(Math.random() * 900));
    }

    /**
     * 生成唯一的renderKey
     * 用于组件渲染时的唯一标识
     *
     * @return 基于时间戳和随机数的唯一字符串
     */
    private static String generateRenderKey() {
        return String.valueOf(System.currentTimeMillis() + (int)(Math.random() * 1000));
    }

    /**
     * 递归转换XML中所有 <sql> 元素的参数占位符：:paramName → #{paramName}
     * 排除数字后的冒号（时间格式如 12:30:00）和标识符后的冒号，支持中文参数名。
     * 使用 CDATA 重新写入内容，避免 setText 丢失 CDATA 包装导致 pretty print
     * 时 trimText 把 SQL 中的换行折叠成空格。
     * @param element 当前XML元素
     */
    private static void transformSqlElements(Element element) {
        @SuppressWarnings("unchecked")
        List<Element> children = element.elements();
        for (Element child : children) {
            if ("sql".equals(child.getName())) {
                String text = child.getText();
                if (text != null && text.contains(":")) {
                    // 排除数字后的冒号（如时间 12:30:00）和标识符后的冒号，支持中文参数名
                    String converted = text.replaceAll(
                            "(?<![a-zA-Z0-9_\\p{L}]):([a-zA-Z_\\p{L}][a-zA-Z0-9_\\p{L}]*)",
                            "#{$1}"
                    );
                    child.clearContent();
                    child.addCDATA(converted);
                }
            } else {
                // 非sql元素继续递归查找
                transformSqlElements(child);
            }
        }
    }

}
