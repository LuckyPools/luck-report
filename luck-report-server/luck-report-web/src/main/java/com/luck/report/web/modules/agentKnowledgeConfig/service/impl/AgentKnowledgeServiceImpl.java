package com.luck.report.web.modules.agentKnowledgeConfig.service.impl;

import com.luck.report.web.utils.SnowflakeIdGenerator;
import com.luck.report.web.modules.agentKnowledgeConfig.constant.AgentKnowledgeMetadataConstant;
import com.luck.report.web.modules.agentKnowledgeConfig.converter.AgentKnowledgeConverter;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.dto.AgentKnowledgeQueryDTO;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.dto.CreateAgentKnowledgeDTO;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.dto.UpdateAgentKnowledgeDTO;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.entity.AgentKnowledge;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.enums.EmbeddingStatus;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.enums.KnowledgeType;
import com.luck.report.web.modules.agentKnowledgeConfig.domain.vo.AgentKnowledgeVO;
import com.luck.report.web.common.vo.PageResultVO;
import com.luck.report.web.modules.agentKnowledgeConfig.mapper.AgentKnowledgeMapper;
import com.luck.report.web.modules.agentKnowledgeConfig.service.AgentKnowledgeService;
import com.luck.report.infra.modules.vector.domain.entity.VectorDocument;
import com.luck.report.infra.modules.vector.domain.dto.VectorStoreSearchResult;
import com.luck.report.infra.modules.vector.service.impl.AgentVectorStore;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 智能体知识服务实现类
 * 提供智能体知识的增删改查和向量化管理功能
 * 关系型数据库存储元数据，向量数据库存储嵌入向量
 *
 * @author luck
 */
@Slf4j
@Service("bean.agentKnowledgeService")
@AllArgsConstructor
public class AgentKnowledgeServiceImpl implements AgentKnowledgeService {

    private final AgentKnowledgeMapper agentKnowledgeMapper;
    private final AgentVectorStore reportAgentVectorStore;
    private final AgentKnowledgeConverter agentKnowledgeConverter;
    private final TransactionTemplate transactionTemplate;

    /**
     * 根据ID查询智能体知识详情
     *
     * @param id 智能体知识ID
     * @return 智能体知识VO
     */
    @Override
    public AgentKnowledgeVO getKnowledgeById(String id) {
        AgentKnowledge knowledge = agentKnowledgeMapper.selectById(id);
        return knowledge == null ? null : agentKnowledgeConverter.toVo(knowledge);
    }

    /**
     * 创建智能体知识
     * 先在事务内插入MySQL，事务提交后再同步到向量存储
     * 使用编程式事务确保向量操作在事务外执行，避免 @Transactional 提前绑定MySQL连接导致数据源切换失效
     *
     * @param createKnowledgeDTO 创建智能体知识DTO
     * @return 智能体知识VO
     */
    @Override
    public AgentKnowledgeVO createKnowledge(CreateAgentKnowledgeDTO createKnowledgeDTO) {
        // 参数校验
        validateCreateKnowledgeDTO(createKnowledgeDTO);

        AgentKnowledge entity = agentKnowledgeConverter.toEntityForCreate(createKnowledgeDTO);
        // 由 Java 端生成 Snowflake ID（不再依赖数据库自增）
        entity.setId(SnowflakeIdGenerator.generateId());

        // 对于文档类型，读取文件内容
        if (KnowledgeType.DOCUMENT.getValue().equals(createKnowledgeDTO.getType())
                && createKnowledgeDTO.getFile() != null) {
            String fileContent = readFileContent(createKnowledgeDTO.getFile());
            entity.setContent(fileContent);
        }

        // MySQL操作放在编程式事务内，事务提交后释放连接
        transactionTemplate.executeWithoutResult(status -> {
            if (agentKnowledgeMapper.insert(entity) <= 0) {
                throw new RuntimeException("添加智能体知识到数据库失败");
            }
        });

        // 向量操作在事务外执行，使用 plugin 自治的 vector 数据源
        embedToVectorStore(entity);

        return agentKnowledgeConverter.toVo(entity);
    }

    /**
     * 读取文件内容
     * 目前支持文本文件，对于复杂文件格式需要添加相应的解析依赖
     *
     * @param file 上传的文件
     * @return 文件内容字符串
     */
    private String readFileContent(MultipartFile file) {
        try {
            // 获取文件名和类型
            String filename = file.getOriginalFilename();
            String contentType = file.getContentType();

            // 对于文本类型的文件，直接读取内容
            if (isTextFile(filename, contentType)) {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            } else {
                // 对于非文本文件，提示需要添加文件解析依赖
                throw new RuntimeException("暂不支持该文件类型: " + contentType + "，请上传文本文件（txt、md等）");
            }
        } catch (IOException e) {
            log.error("读取文件内容失败", e);
            throw new RuntimeException("读取文件内容失败: " + e.getMessage());
        }
    }

    /**
     * 判断是否为文本文件
     *
     * @param filename 文件名
     * @param contentType 内容类型
     * @return 是否为文本文件
     */
    private boolean isTextFile(String filename, String contentType) {
        if (contentType != null && contentType.startsWith("text/")) {
            return true;
        }
        if (filename != null) {
            String lowerName = filename.toLowerCase();
            return lowerName.endsWith(".txt") || lowerName.endsWith(".md")
                    || lowerName.endsWith(".json") || lowerName.endsWith(".xml")
                    || lowerName.endsWith(".csv") || lowerName.endsWith(".log");
        }
        return false;
    }

    /**
     * 参数校验：文档类型必须有文件，QA/FAQ类型必须有问题和内容
     *
     * @param dto 创建智能体知识DTO
     */
    private void validateCreateKnowledgeDTO(CreateAgentKnowledgeDTO dto) {
        if (KnowledgeType.DOCUMENT.getValue().equals(dto.getType()) && dto.getFile() == null) {
            throw new RuntimeException("文档类型知识必须上传文件");
        }
        if (KnowledgeType.QA.getValue().equals(dto.getType()) || KnowledgeType.FAQ.getValue().equals(dto.getType())) {
            if (!StringUtils.hasText(dto.getQuestion())) {
                throw new RuntimeException("QA或FAQ类型知识必须填写问题");
            }
            if (!StringUtils.hasText(dto.getContent())) {
                throw new RuntimeException("QA或FAQ类型知识必须填写内容");
            }
        }
    }

    /**
     * 将知识向量化并存储到向量库
     * 成功则更新状态为COMPLETED，失败则更新状态为FAILED
     *
     * @param knowledge 智能体知识实体
     */
    private void embedToVectorStore(AgentKnowledge knowledge) {
        try {
            VectorDocument document = convertToVectorDocument(knowledge);
            reportAgentVectorStore.addDocuments(Collections.singletonList(document), knowledge.getModelId());
            knowledge.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            knowledge.setErrorMsg(null);
            agentKnowledgeMapper.update(knowledge);
        } catch (Exception e) {
            String errorMsg = truncateErrorMsg("向量化失败: " + e.getMessage());
            knowledge.setEmbeddingStatus(EmbeddingStatus.FAILED);
            knowledge.setErrorMsg(errorMsg);
            agentKnowledgeMapper.update(knowledge);
            log.error("智能体知识向量化失败, id: {}, error: {}", knowledge.getId(), errorMsg);
        }
    }

    /**
     * 将智能体知识转换为向量文档
     *
     * @param knowledge 智能体知识实体
     * @return 向量文档对象
     */
    private VectorDocument convertToVectorDocument(AgentKnowledge knowledge) {
        String content;
        if (knowledge.getType() == KnowledgeType.DOCUMENT) {
            // 文档类型：内容来自文件解析后的content字段
            content = knowledge.getContent();
            if (!StringUtils.hasText(content)) {
                throw new RuntimeException("文档内容不能为空");
            }
        } else {
            // QA/FAQ类型：将问题和内容组合
            content = String.format("问题: %s, 答案: %s",
                    knowledge.getQuestion() != null ? knowledge.getQuestion() : "",
                    knowledge.getContent() != null ? knowledge.getContent() : "");
            if (!StringUtils.hasText(content)) {
                throw new RuntimeException("QA/FAQ内容不能为空");
            }
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put(AgentKnowledgeMetadataConstant.VECTOR_TYPE, AgentKnowledgeMetadataConstant.AGENT_KNOWLEDGE);
        metadata.put(AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID, knowledge.getId());

        return new VectorDocument(content, metadata);
    }

    /**
     * 更新智能体知识
     * 先在事务内更新MySQL，事务提交后再同步到向量存储
     *
     * @param id 智能体知识ID
     * @param updateKnowledgeDTO 更新智能体知识DTO
     * @return 智能体知识VO
     */
    @Override
    public AgentKnowledgeVO updateKnowledge(String id, UpdateAgentKnowledgeDTO updateKnowledgeDTO) {
        AgentKnowledge knowledge = agentKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("智能体知识不存在, id: " + id);
        }

        agentKnowledgeConverter.applyUpdateToEntity(knowledge, updateKnowledgeDTO);
        knowledge.setEmbeddingStatus(EmbeddingStatus.PROCESSING);

        // MySQL操作放在编程式事务内
        transactionTemplate.executeWithoutResult(status -> {
            if (agentKnowledgeMapper.update(knowledge) <= 0) {
                throw new RuntimeException("更新智能体知识到数据库失败");
            }
        });

        // 向量操作在事务外执行
        try {
            syncToVectorStore(knowledge);
            knowledge.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            knowledge.setErrorMsg(null);
            agentKnowledgeMapper.update(knowledge);
        } catch (Exception e) {
            String errorMsg = truncateErrorMsg("更新向量存储失败: " + e.getMessage());
            knowledge.setEmbeddingStatus(EmbeddingStatus.FAILED);
            knowledge.setErrorMsg(errorMsg);
            agentKnowledgeMapper.update(knowledge);
            log.error("更新向量存储失败, id: {}, error: {}", id, errorMsg);
        }

        return agentKnowledgeConverter.toVo(knowledge);
    }

    /**
     * 同步知识到向量库（先删除旧向量，再添加新向量）
     *
     * @param knowledge 智能体知识实体
     */
    private void syncToVectorStore(AgentKnowledge knowledge) {
        // 先删除旧的向量数据
        deleteVectorByKnowledgeId(knowledge.getId());

        // 添加新的向量数据
        VectorDocument document = convertToVectorDocument(knowledge);
        reportAgentVectorStore.addDocuments(Collections.singletonList(document), knowledge.getModelId());
        log.info("成功更新向量存储, id: {}", knowledge.getId());
    }

    /**
     * 删除智能体知识
     * 先在事务外删除向量数据，再在事务内逻辑删除MySQL数据
     *
     * @param id 智能体知识ID
     * @return 是否删除成功
     */
    @Override
    public boolean deleteKnowledge(String id) {
        AgentKnowledge knowledge = agentKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            log.warn("智能体知识不存在, id: {}", id);
            return true;
        }

        // 向量操作在事务外执行
        deleteVectorByKnowledgeId(id);

        // MySQL操作放在编程式事务内
        transactionTemplate.executeWithoutResult(status -> {
            knowledge.setIsDeleted(1);
            knowledge.setIsResourceCleaned(0);
            if (agentKnowledgeMapper.update(knowledge) <= 0) {
                throw new RuntimeException("逻辑删除智能体知识失败");
            }
        });

        return true;
    }

    /**
     * 根据知识ID删除向量数据
     *
     * @param knowledgeId 智能体知识ID
     */
    private void deleteVectorByKnowledgeId(String knowledgeId) {
        // 调用新的组合删除接口：按 vectorType + metadata 字段删除
        reportAgentVectorStore.deleteByMetadata(
            AgentKnowledgeMetadataConstant.AGENT_KNOWLEDGE,
            AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID,
            knowledgeId
        );
    }

    /**
     * 分页条件查询智能体知识
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @Override
    public PageResultVO<AgentKnowledgeVO> queryByPage(AgentKnowledgeQueryDTO queryDTO) {
        int offset = (queryDTO.getPageNum() - 1) * queryDTO.getPageSize();

        Long total = agentKnowledgeMapper.countByConditions(queryDTO);

        List<AgentKnowledge> dataList = agentKnowledgeMapper.selectByConditionsWithPage(queryDTO, offset, queryDTO.getPageSize());
        List<AgentKnowledgeVO> dataListVO = dataList.stream()
                .map(agentKnowledgeConverter::toVo)
                .collect(Collectors.toList());

        return PageResultVO.success(dataListVO, total, queryDTO.getPageNum(), queryDTO.getPageSize());
    }

    /**
     * 更新智能体知识的生效状态
     * 仅更新MySQL，不更新向量库；检索时通过动态过滤生效ID列表来隔离未生效数据
     *
     * @param id 智能体知识ID
     * @param enabled 是否生效
     * @return 智能体知识VO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public AgentKnowledgeVO updateEnabledStatus(String id, Boolean enabled) {
        AgentKnowledge knowledge = agentKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("智能体知识不存在, id: " + id);
        }

        // 仅更新MySQL生效状态，向量库数据保留；检索时由调用方传入生效ID列表进行动态过滤
        knowledge.setEnabled(enabled ? 1 : 0);
        agentKnowledgeMapper.update(knowledge);

        return agentKnowledgeConverter.toVo(knowledge);
    }

    /**
     * 重试向量化
     * 对失败的智能体知识重新进行向量化
     *
     * @param id 智能体知识ID
     */
    @Override
    public void retryEmbedding(String id) {
        AgentKnowledge knowledge = agentKnowledgeMapper.selectById(id);
        if (knowledge == null) {
            throw new RuntimeException("智能体知识不存在, id: " + id);
        }

        if (knowledge.getEmbeddingStatus() == EmbeddingStatus.PROCESSING) {
            throw new RuntimeException("智能体知识正在处理中，请等待");
        }

        // 未生效的不处理
        if (knowledge.getEnabled() == null || knowledge.getEnabled() == 0) {
            throw new RuntimeException("智能体知识未生效，请先设为生效");
        }

        // 重置状态为待处理
        knowledge.setEmbeddingStatus(EmbeddingStatus.PENDING);
        knowledge.setErrorMsg(null);
        agentKnowledgeMapper.update(knowledge);

        // 重新向量化
        try {
            syncToVectorStore(knowledge);
            knowledge.setEmbeddingStatus(EmbeddingStatus.COMPLETED);
            knowledge.setErrorMsg(null);
            agentKnowledgeMapper.update(knowledge);
        } catch (Exception e) {
            String errorMsg = truncateErrorMsg(e.getMessage());
            knowledge.setEmbeddingStatus(EmbeddingStatus.FAILED);
            knowledge.setErrorMsg(errorMsg);
            agentKnowledgeMapper.update(knowledge);
            throw new RuntimeException("重试向量化失败: " + errorMsg);
        }
    }

    /**
     * 截断错误信息，确保不超过数据库字段长度
     *
     * @param errorMsg 原始错误信息
     * @return 截断后的错误信息，最大长度为 500 字符
     */
    private String truncateErrorMsg(String errorMsg) {
        if (errorMsg == null) {
            return null;
        }
        return errorMsg.length() > 490 ? errorMsg.substring(0, 490) : errorMsg;
    }

    /**
     * 根据ID列表批量查询智能体知识实体
     * 用于向量检索结果回填原文内容
     *
     * @param ids 智能体知识ID列表
     * @return 智能体知识实体列表
     */
    @Override
    public List<AgentKnowledge> selectByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return agentKnowledgeMapper.selectByIds(ids);
    }

    /**
     * 查询所有生效的智能体知识ID列表
     * 用于向量检索时动态过滤，只召回 enabled=1 的知识
     *
     * @return 生效的智能体知识ID列表
     */
    @Override
    public List<String> selectEnabledKnowledgeIds() {
        return agentKnowledgeMapper.selectEnabledKnowledgeIds();
    }

    /**
     * 回填智能体知识原文内容
     * 根据 metadata 中的 agentKnowledgeId 从 MySQL 批量查询，构建完整 content
     *
     * @param results 向量检索结果列表
     */
    @Override
    public void fillAgentKnowledgeContent(List<VectorStoreSearchResult> results) {
        if (results == null || results.isEmpty()) {
            return;
        }

        // 1. 从 metadata 中提取所有 agentKnowledgeId（统一转为 String）
        List<String> ids = results.stream()
                .map(r -> r.getDocument().getMetadata())
                .filter(m -> m != null && m.containsKey(AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID))
                .map(m -> String.valueOf(m.get(AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID)))
                .filter(id -> id != null && !id.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (ids.isEmpty()) {
            log.warn("向量检索结果中没有有效的 agentKnowledgeId");
            return;
        }

        // 2. 批量查询智能体知识
        List<AgentKnowledge> knowledgeList = selectByIds(ids);
        if (knowledgeList.isEmpty()) {
            log.warn("根据 agentKnowledgeId 未查询到任何智能体知识: ids={}", ids);
            return;
        }

        // 3. 构建 ID -> Index 的映射
        Map<String, AgentKnowledge> knowledgeMap = knowledgeList.stream()
                .collect(Collectors.toMap(AgentKnowledge::getId, k -> k));

        // 4. 回填 content
        for (VectorStoreSearchResult result : results) {
            Map<String, Object> metadata = result.getDocument().getMetadata();
            if (metadata == null || !metadata.containsKey(AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID)) {
                continue;
            }

            String id = String.valueOf(metadata.get(AgentKnowledgeMetadataConstant.DB_AGENT_KNOWLEDGE_ID));
            if (id.isEmpty()) {
                continue;
            }

            AgentKnowledge knowledge = knowledgeMap.get(id);
            if (knowledge != null) {
                // 根据类型构建完整的 content
                String content;
                if (knowledge.getType() == KnowledgeType.DOCUMENT) {
                    content = knowledge.getContent();
                } else {
                    // QA/FAQ类型：组合问题和答案
                    content = String.format("问题: %s, 答案: %s",
                            knowledge.getQuestion() != null ? knowledge.getQuestion() : "",
                            knowledge.getContent() != null ? knowledge.getContent() : "");
                }
                result.getDocument().setContent(content);

                // 补充 title 到 metadata
                metadata.put("title", knowledge.getTitle());
            }
        }

        log.info("回填智能体知识内容完成，处理 {} 条结果", results.size());
    }
}
