package com.luck.report.web.controller.designer;

import com.luck.report.core.cache.ReportDefinitionCache;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.dsl.ReportParserLexer;
import com.luck.report.core.dsl.ReportParserParser;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.expression.ErrorInfo;
import com.luck.report.core.expression.ScriptErrorListener;
import com.luck.report.core.parser.ReportParser;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.exception.ReportDesignException;
import com.luck.report.web.filter.RequestHolderFilter;
import com.luck.report.web.utils.UrlParameterUtils;
import com.luck.report.web.utils.ResponseUtils;
import org.antlr.v4.runtime.ANTLRInputStream;
import org.antlr.v4.runtime.CommonTokenStream;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

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
        ANTLRInputStream antlrInputStream = new ANTLRInputStream(content);
        ReportParserLexer lexer = new ReportParserLexer(antlrInputStream);
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
        ANTLRInputStream antlrInputStream = new ANTLRInputStream(content);
        ReportParserLexer lexer = new ReportParserLexer(antlrInputStream);
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
        ANTLRInputStream antlrInputStream = new ANTLRInputStream(expr);
        ReportParserLexer lexer = new ReportParserLexer(antlrInputStream);
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
        ReportScopedCache.putObject(fileName, reportDef);
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
        if (obj instanceof ReportDefinition) {
            ReportDefinition reportDef = (ReportDefinition) obj;
            ReportScopedCache.removeObject(fileName);
            ResponseUtils.writeObjectToJson(resp, new ReportDefinitionWrapper(reportDef));
        } else {
            ReportDefinition reportDef = reportRender.parseReport(fileName);
            ResponseUtils.writeObjectToJson(resp, new ReportDefinitionWrapper(reportDef));
        }
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
            logger.error("保存报表异常",e);
            throw e;
        }
        // reportRender.rebuildReportDefinition(reportDef);
        ReportDefinitionCache.putObject(file, reportDef);
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
