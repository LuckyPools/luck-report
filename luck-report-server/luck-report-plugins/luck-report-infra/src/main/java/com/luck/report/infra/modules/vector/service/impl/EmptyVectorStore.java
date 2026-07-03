package com.luck.report.infra.modules.vector.service.impl;

import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.domain.param.VectorSearchParam;
import com.luck.report.infra.modules.vector.service.VectorStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;

/**
 * 空向量存储实现（无向量数据库时的兜底实现）
 * 当未配置向量数据库时，使用此实现保证项目能正常启动
 * 所有操作返回空结果或抛出明确异常，调用方可根据业务需求处理
 *
 * 设计原则：
 * 1. 不阻塞项目启动
 * 2. 向量操作时给出明确提示，便于排查
 * 3. 检索操作返回空列表，不影响业务流程
 * 4. 写入操作抛出异常，提醒调用方标记失败状态
 *
 * @author luck
 */
public class EmptyVectorStore implements VectorStore {

    private static final Logger log = LoggerFactory.getLogger(EmptyVectorStore.class);

    /** 未配置向量数据库的提示信息 */
    private static final String NOT_CONFIGURED_MSG = "向量数据库未配置，请在 application.yml 中配置 luck-report.vector 相关信息";

    /**
     * 添加向量到存储（写入操作，抛出异常提醒调用方）
     *
     * @param documents 向量文档列表，忽略内容
     * @throws UnsupportedOperationException 向量数据库未配置
     */
    @Override
    public void add(List<VectorDocument> documents) {
        log.warn(NOT_CONFIGURED_MSG);
        throw new UnsupportedOperationException(NOT_CONFIGURED_MSG);
    }

    /**
     * 按文档ID删除（写入操作，返回失败）
     *
     * @param ids 文档ID列表，忽略内容
     * @return false 表示删除失败
     */
    @Override
    public boolean delete(List<String> ids) {
        log.warn(NOT_CONFIGURED_MSG);
        return false;
    }

    /**
     * 按向量类型删除（写入操作，返回失败）
     *
     * @param vectorType 知识类型，忽略内容
     * @return false 表示删除失败
     */
    @Override
    public boolean deleteByVectorType(String vectorType) {
        log.warn(NOT_CONFIGURED_MSG);
        return false;
    }

    /**
     * 按向量类型 + metadata 组合删除（写入操作，返回失败）
     *
     * @param vectorType 知识类型，忽略内容
     * @param metaKey metadata 字段名，忽略内容
     * @param metaValue 字段值，忽略内容
     * @return false 表示删除失败
     */
    @Override
    public boolean deleteByVectorTypeAndMetadata(String vectorType, String metaKey, Object metaValue) {
        log.warn(NOT_CONFIGURED_MSG);
        return false;
    }

    /**
     * 统一向量检索入口（查询操作，返回空列表）
     *
     * @param param 检索参数，忽略内容
     * @return 空列表
     */
    @Override
    public List<VectorStoreSearchResult> search(VectorSearchParam param) {
        log.debug(NOT_CONFIGURED_MSG);
        return Collections.emptyList();
    }
}
