package com.luck.report.chroma.vector.config;

import org.springframework.boot.autoconfigure.AutoConfigureOrder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import com.luck.report.chroma.vector.service.impl.ChromaVectorStoreImpl;
import com.luck.report.infra.modules.vector.service.VectorStore;

import tech.amikos.chromadb.Client;
import tech.amikos.chromadb.handler.ApiClient;
import tech.amikos.chromadb.handler.DefaultApi;

/**
 * Chroma 向量存储自动配置
 * 仅当 luck-report.vector.type=chroma 时生效
 * 使用高优先级确保在 EmptyVectorStoreAutoConfiguration 之前加载
 *
 * 包含：
 * 1. chromaClient Bean：Chroma HTTP 客户端（高层 API，用于 Collection 管理）
 * 2. chromaApi Bean：Chroma 底层 DefaultApi（用于直接传向量的增删查操作）
 * 3. VectorStore Bean：ChromaVectorStoreImpl 实现
 * 4. 组件扫描
 *
 * 为什么需要 DefaultApi：
 * - 高层 Collection.query() 只接受 queryTexts（文本），内部自动用 EmbeddingFunction 转向量
 * - 我们的 VectorStore 接口设计是调用方提供向量，不需要 Chroma 内嵌的 EmbeddingFunction
 * - 底层 DefaultApi.getNearestNeighbors() 支持直接传 queryEmbeddings
 *
 * @author luck
 */
@Configuration
@ConditionalOnProperty(name = "luck-report.vector.type", havingValue = "chroma")
@EnableConfigurationProperties(ChromaVectorProperties.class)
@ComponentScan(basePackages = "com.luck.report.chroma.vector")
public class ChromaVectorStoreAutoConfiguration {

    /**
     * 创建 Chroma HTTP 客户端（高层 API，用于 Collection 管理）
     *
     * @param props Chroma 配置属性
     * @return Client 实例
     */
    @Bean
    @ConditionalOnMissingBean(Client.class)
    public Client chromaClient(ChromaVectorProperties props) {
        return new Client(props.getUrl());
    }

    /**
     * 创建 Chroma 底层 API（用于直接传向量的增删查操作）
     * DefaultApi 通过 ApiClient 连接 Chroma 服务，与 Client 共用同一个 URL
     *
     * @param props Chroma 配置属性
     * @return DefaultApi 实例
     */
    @Bean
    @ConditionalOnMissingBean(DefaultApi.class)
    public DefaultApi chromaApi(ChromaVectorProperties props) {
        ApiClient apiClient = new ApiClient();
        apiClient.setBasePath(props.getUrl());
        return new DefaultApi(apiClient);
    }

    /**
     * 注册 Chroma 向量存储实现 Bean
     *
     * @param chromaClient Chroma 客户端（Collection 管理）
     * @param api Chroma 底层 API（增删查操作）
     * @param props Chroma 配置属性
     * @return ChromaVectorStoreImpl 实例
     */
    @Bean
    @ConditionalOnMissingBean(VectorStore.class)
    public VectorStore chromaVectorStore(Client chromaClient, DefaultApi api, ChromaVectorProperties props) {
        return new ChromaVectorStoreImpl(chromaClient, api, props.getCollectionName());
    }
}
