package com.luck.report.web.controller.designer;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.cache.ReportDefinitionWrapperCache;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.ReportDefinitionWrapper;
import com.luck.report.core.dsl.ReportParserLexer;
import com.luck.report.core.dsl.ReportParserParser;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.expression.ErrorInfo;
import com.luck.report.core.expression.ScriptErrorListener;
import com.luck.report.core.parser.ReportParser;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.domain.vo.ReportDefinitionVo;
import com.luck.report.web.exception.ReportDesignException;
import com.luck.report.web.filter.RequestHolderFilter;
import com.luck.report.web.utils.UrlParameterUtils;
import com.luck.report.web.utils.ResponseUtils;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.*;

/**
 * 报表设计器控制器
 *
 * @author Jacky.gao
 * @since 2017年1月25日
 */
@Controller("bean.designerController")
@RequestMapping("${luck-report.servletPrefix:}/designer")
public class DesignerController implements ApplicationContextAware {

    private static final Logger logger = LoggerFactory.getLogger(RequestHolderFilter.class);
    private final List<ReportProvider> reportProviders = new ArrayList<>();

    /**
     * 新建报表的空白模板（位于 classpath:template/template.ureport.xml）
     */
    private static final String DEFAULT_REPORT_TEMPLATE = "template/template.ureport.xml";

    @Autowired
    private ReportRender reportRender;
    @Autowired
    private ReportParser reportParser;


    /**
     * 脚本验证
     */
    @RequestMapping("/scriptValidation")
    public void scriptValidation(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String content = req.getParameter("content");
        CharStream input = CharStreams.fromString(content);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        ScriptErrorListener errorListener = new ScriptErrorListener();
        parser.removeErrorListeners();
        parser.addErrorListener(errorListener);
        parser.expression();
        List<ErrorInfo> infos = errorListener.getInfos();
        ResponseUtils.writeObjectToJson(resp, infos);
    }

    /**
     * 条件脚本验证
     */
    @RequestMapping("/conditionScriptValidation")
    public void conditionScriptValidation(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String content = req.getParameter("content");
        CharStream input = CharStreams.fromString(content);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        ScriptErrorListener errorListener = new ScriptErrorListener();
        parser.removeErrorListeners();
        parser.addErrorListener(errorListener);
        parser.expr();
        List<ErrorInfo> infos = errorListener.getInfos();
        ResponseUtils.writeObjectToJson(resp, infos);
    }

    /**
     * 解析数据集名称
     */
    @RequestMapping("/parseDatasetName")
    public void parseDatasetName(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String expr = req.getParameter("expr");
        CharStream input = CharStreams.fromString(expr);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        parser.removeErrorListeners();
        ReportParserParser.DatasetContext ctx = parser.dataset();
        String datasetName = ctx.Identifier().getText();
        Map<String, String> result = new HashMap<String, String>();
        result.put("datasetName", datasetName);
        ResponseUtils.writeObjectToJson(resp, result);
    }


    /**
     * 保存预览文件
     */
    @RequestMapping("/savePreviewFile")
    public void savePreviewFile(HttpServletRequest req, HttpServletResponse resp) {
        String content = req.getParameter("content");
        String fileName = req.getParameter("fileName");
        content = decode(content);
        fileName = decode(fileName);
        InputStream inputStream = IOUtils.toInputStream(content, "utf-8");
        ReportDefinition reportDef = reportParser.parse(inputStream, fileName);
        IOUtils.closeQuietly(inputStream);
        ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDef);
        ReportScopedCache.putObject(fileName, wrapper);
    }

    /**
     * 加载报表
     */
    @RequestMapping(value = "/loadReport")
    public void loadReport(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String filePath = req.getParameter("filePath");
        if (filePath == null) {
            throw new ReportDesignException("Report file can not be null.");
        }
        String fileName = UrlParameterUtils.doubleDecode(filePath);
        Object obj = ReportScopedCache.getObject(fileName);
        ReportDefinition reportDefinition;
        if (obj instanceof ReportDefinitionWrapper) {
            ReportDefinitionWrapper wrapper = (ReportDefinitionWrapper) obj;
            reportDefinition = wrapper.getReportDefinition();
            ReportScopedCache.removeObject(fileName);
        } else {
            reportDefinition = reportRender.parseReport(fileName);
        }
        ResponseUtils.writeObjectToJson(resp, new ReportDefinitionVo(reportDefinition));
    }

    /**
     * 删除报表文件
     */
    @RequestMapping("/deleteReportFile")
    public void deleteReportFile(HttpServletRequest req, HttpServletResponse resp) {
        String file = req.getParameter("file");
        if (file == null) {
            throw new ReportDesignException("Report file can not be null.");
        }
        ReportProvider targetReportProvider = null;
        for (ReportProvider provider : reportProviders) {
            if (file.startsWith(provider.getPrefix())) {
                targetReportProvider = provider;
                break;
            }
        }
        if (targetReportProvider == null) {
            throw new ReportDesignException("File [" + file + "] not found available report provider.");
        }
        targetReportProvider.deleteReport(file);
    }

    /**
     * 保存报表文件
     */
    @RequestMapping("/saveReportFile")
    public void saveReportFile(HttpServletRequest req, HttpServletResponse resp) {
        String file = req.getParameter("file");
        file = UrlParameterUtils.doubleDecode(file);
        String content = req.getParameter("content");
        content = decode(content);
        ReportProvider targetReportProvider = null;
        for (ReportProvider provider : reportProviders) {
            if (file.startsWith(provider.getPrefix())) {
                targetReportProvider = provider;
                break;
            }
        }
        if (targetReportProvider == null) {
            throw new ReportDesignException("File [" + file + "] not found available report provider.");
        }
        ReportDefinition reportDef;
        try{
            InputStream inputStream = IOUtils.toInputStream(content, "utf-8");
            reportDef = reportParser.parse(inputStream, file);
            IOUtils.closeQuietly(inputStream);
        }catch (Exception e){
            logger.error("Save Report Exception",e);
            throw e;
        }
        ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDef);
        ReportDefinitionWrapperCache.putObject(file, wrapper);
        targetReportProvider.saveReport(file, content);
    }

    /**
     * 加载报表提供者
     */
    @RequestMapping("/loadReportProviders")
    public void loadReportProviders(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getParameter("path");
        if (path == null || path.isEmpty()) {
            ResponseUtils.writeObjectToJson(resp, reportProviders);
        } else {
            Map<String, Object> result = new HashMap<>();
            for (ReportProvider provider : reportProviders) {
                if (provider.disabled() || provider.getName() == null) {
                    continue;
                }
                Map<String, Object> providerData = new HashMap<>();
                providerData.put("name", provider.getName());
                providerData.put("prefix", provider.getPrefix());
                providerData.put("disabled", provider.disabled());
                providerData.put("reportFiles", provider.getReportFiles(path));
                result.put(provider.getPrefix(), providerData);
            }
            ResponseUtils.writeObjectToJson(resp, result);
        }
    }

    /**
     * 新建报表
     * - 接收 fileName（报表名，含 .ureport.xml 后缀）与 provider（报表来源前缀，例如 file:）
     * - 使用 classpath:template/template.ureport.xml 空白模板在指定 provider 下创建报表
     * - 完整文件路径 = provider + fileName（例如 file:xxx.ureport.xml）
     * - 返回 ResultVO{ code=0, data={ fileName, filePath, provider } } 成功
     * - 失败：ResultVO{ code≠0, message=错误信息 }
     */
    @RequestMapping("/createReport")
    @ResponseBody
    public ResultVO<Map<String, String>> createReport(HttpServletRequest req, HttpServletResponse resp) {
        try {
            String fileName = req.getParameter("fileName");
            String providerPrefix = req.getParameter("provider");
            if (fileName == null || fileName.trim().isEmpty()) {
                return ResultVO.error(400, "File name can not be empty.");
            }
            if (providerPrefix == null || providerPrefix.trim().isEmpty()) {
                return ResultVO.error(400, "Report provider can not be empty.");
            }
            fileName = fileName.trim();
            providerPrefix = providerPrefix.trim();

            // 找到对应的 ReportProvider
            ReportProvider targetReportProvider = null;
            for (ReportProvider provider : reportProviders) {
                if (provider.disabled() || provider.getName() == null) {
                    continue;
                }
                String prefix = provider.getPrefix();
                if (prefix == null) {
                    continue;
                }
                if (providerPrefix.equals(prefix) || providerPrefix.startsWith(prefix)) {
                    targetReportProvider = provider;
                    break;
                }
            }
            if (targetReportProvider == null) {
                return ResultVO.error(404, "Provider [" + providerPrefix + "] not found available report provider.");
            }

            // 拼接完整文件路径（包含 provider 前缀）
            String fullFilePath = providerPrefix + fileName;

            // 检查报表是否已存在，避免覆盖已有文件
            List<ReportFile> existingFiles = targetReportProvider.getReportFiles();
            for (ReportFile rf : existingFiles) {
                if (!rf.isDirectory() && (fullFilePath.endsWith(rf.getName()) || fullFilePath.equals(providerPrefix + rf.getName()))) {
                    return ResultVO.error(409, "Report [" + fileName + "] already exists in provider [" + providerPrefix + "].");
                }
            }

            // 读取空白模板
            String content;
            InputStream templateStream = null;
            try {
                ClassPathResource resource = new ClassPathResource(DEFAULT_REPORT_TEMPLATE);
                if (!resource.exists()) {
                    return ResultVO.error(500, "Default report template not found: " + DEFAULT_REPORT_TEMPLATE);
                }
                templateStream = resource.getInputStream();
                content = IOUtils.toString(templateStream, "utf-8");
            } catch (IOException e) {
                logger.error("Failed to load default report template", e);
                return ResultVO.error(500, "Failed to load default report template: " + e.getMessage());
            } finally {
                IOUtils.closeQuietly(templateStream);
            }

            // 解析模板，验证格式合法
            InputStream contentStream = null;
            try {
                contentStream = IOUtils.toInputStream(content, "utf-8");
                ReportDefinition reportDef = reportParser.parse(contentStream, fullFilePath);
                ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDef);
                ReportDefinitionWrapperCache.putObject(fullFilePath, wrapper);
            } catch (Exception e) {
                logger.error("Failed to parse default report template", e);
                return ResultVO.error(500, "Failed to parse default report template: " + e.getMessage());
            } finally {
                IOUtils.closeQuietly(contentStream);
            }

            // 写入到 provider 存储
            targetReportProvider.saveReport(fullFilePath, content);

            Map<String, String> data = new HashMap<>();
            data.put("fileName", fileName);
            data.put("filePath", fullFilePath);
            data.put("provider", providerPrefix);
            return ResultVO.success("Created", data);
        } catch (Exception e) {
            logger.error("Create report exception", e);
            return ResultVO.error(500, "Create report failed: " + e.getMessage());
        }
    }

    /**
     * 解码内容
     */
    protected String decode(String content) {
        if (content == null) {
            return content;
        }
        try {
            content = URLDecoder.decode(content, "utf-8");
            return content;
        } catch (Exception ex) {
            return content;
        }
    }

    /**
     * 设置应用上下文
     */
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        Collection<ReportProvider> providers = applicationContext.getBeansOfType(ReportProvider.class).values();
        for (ReportProvider provider : providers) {
            if (provider.disabled() || provider.getName() == null) {
                continue;
            }
            reportProviders.add(provider);
        }
    }

}
