package com.luck.report.web.service;

import com.luck.report.core.cache.ReportDefinitionWrapperCache;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.ReportDefinitionWrapper;
import com.luck.report.core.dsl.ReportParserLexer;
import com.luck.report.core.dsl.ReportParserParser;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.expression.ErrorInfo;
import com.luck.report.core.expression.ScriptErrorListener;
import com.luck.report.core.parser.ReportParser;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.domain.vo.report.ReportDefinitionVo;
import com.luck.report.web.exception.ReportDesignException;
import com.luck.report.web.utils.UrlParameterUtils;
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
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.*;

/**
 * 报表设计器服务，负责设计器相关业务（脚本校验、保存、加载、删除报表等）
 */
@Service("bean.designerService")
public class DesignerService implements ApplicationContextAware {

    private static final Logger logger = LoggerFactory.getLogger(DesignerService.class);

    private final List<ReportProvider> reportProviders = new ArrayList<>();

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportParser reportParser;

    /**
     * 脚本验证：解析脚本中的表达式并收集错误信息
     *
     * @param content 脚本内容，不能为空
     * @return 错误信息列表
     */
    public List<ErrorInfo> scriptValidation(String content) {
        CharStream input = CharStreams.fromString(content);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        ScriptErrorListener errorListener = new ScriptErrorListener();
        parser.removeErrorListeners();
        parser.addErrorListener(errorListener);
        parser.expression();
        return errorListener.getInfos();
    }

    /**
     * 条件脚本验证：解析条件表达式并收集错误信息
     *
     * @param content 条件表达式内容，不能为空
     * @return 错误信息列表
     */
    public List<ErrorInfo> conditionScriptValidation(String content) {
        CharStream input = CharStreams.fromString(content);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        ScriptErrorListener errorListener = new ScriptErrorListener();
        parser.removeErrorListeners();
        parser.addErrorListener(errorListener);
        parser.expr();
        return errorListener.getInfos();
    }

    /**
     * 解析表达式中的数据集名称
     *
     * @param expr 表达式字符串，不能为空
     * @return 数据集名称
     */
    public String parseDatasetName(String expr) {
        CharStream input = CharStreams.fromString(expr);
        ReportParserLexer lexer = new ReportParserLexer(input);
        CommonTokenStream tokenStream = new CommonTokenStream(lexer);
        ReportParserParser parser = new ReportParserParser(tokenStream);
        parser.removeErrorListeners();
        ReportParserParser.DatasetContext ctx = parser.dataset();
        return ctx.Identifier().getText();
    }

    /**
     * 保存预览文件到作用域缓存
     *
     * @param fileName 文件名，作为缓存键
     * @param content  报表XML内容
     */
    public void savePreviewFile(String fileName, String content) {
        content = decode(content);
        fileName = decode(fileName);
        InputStream inputStream = IOUtils.toInputStream(content, "utf-8");
        try {
            ReportDefinition reportDef = reportParser.parse(inputStream, fileName);
            ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDef);
            ReportScopedCache.putObject(fileName, wrapper);
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }

    /**
     * 加载报表定义，优先从预览缓存加载，缓存不存在时通过ReportRender解析
     *
     * @param filePath 报表文件路径，不能为空
     * @return 报表定义VO
     */
    public ReportDefinitionVo loadReport(String filePath) {
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
        return new ReportDefinitionVo(reportDefinition);
    }

    /**
     * 删除报表文件
     *
     * @param file 报表文件路径，不能为空
     */
    public void deleteReportFile(String file) {
        if (file == null) {
            throw new ReportDesignException("Report file can not be null.");
        }
        resolveProvider(file).deleteReport(file);
    }

    /**
     * 保存报表文件：解析XML内容、写入缓存并调用Provider持久化
     *
     * @param file    报表文件路径
     * @param content 报表XML内容
     */
    public void saveReportFile(String file, String content) {
        file = UrlParameterUtils.doubleDecode(file);
        content = decode(content);
        ReportProvider targetReportProvider = resolveProvider(file);
        ReportDefinition reportDef;
        try {
            InputStream inputStream = IOUtils.toInputStream(content, "utf-8");
            reportDef = reportParser.parse(inputStream, file);
            IOUtils.closeQuietly(inputStream);
        } catch (Exception e) {
            logger.error("Save Report Exception", e);
            throw e;
        }
        ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDef);
        ReportDefinitionWrapperCache.putObject(file, wrapper);
        ReportScopedCache.removeObject(file);
        targetReportProvider.saveReport(file, content);
    }

    /**
     * 加载报表提供者列表，path为空时返回提供者基本信息，否则返回含文件列表的详情
     *
     * @param path 报表路径，可为空
     * @return 提供者数据（Map列表或含文件的详情Map）
     */
    public Object loadReportProviders(String path) {
        if (path == null || path.isEmpty()) {
            return reportProviders;
        }
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
        return result;
    }

    /**
     * 根据文件路径匹配对应的ReportProvider
     *
     * @param file 报表文件路径
     * @return 匹配的ReportProvider
     * @throws ReportDesignException 找不到可用Provider时抛出
     */
    private ReportProvider resolveProvider(String file) {
        for (ReportProvider provider : reportProviders) {
            if (file.startsWith(provider.getPrefix())) {
                return provider;
            }
        }
        throw new ReportDesignException("File [" + file + "] not found available report provider.");
    }

    /**
     * URL解码内容
     *
     * @param content 待解码内容，可为空
     * @return 解码后内容
     */
    private String decode(String content) {
        if (content == null) {
            return content;
        }
        try {
            return URLDecoder.decode(content, "utf-8");
        } catch (Exception ex) {
            return content;
        }
    }

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
