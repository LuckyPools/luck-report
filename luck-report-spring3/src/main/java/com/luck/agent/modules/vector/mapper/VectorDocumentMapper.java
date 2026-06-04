package com.luck.agent.modules.vector.mapper;

import com.luck.agent.annotation.DataSource;
import com.luck.agent.modules.vector.domain.entity.VectorDocumentRow;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 向量文档 Mapper
 * 操作 PostgreSQL 的 vector_document 表，标注 @DataSource("pgvector") 使用 PostgreSQL 数据源
 * 包含文档的增删查操作，支持 pgvector 的向量检索和 jsonb 元数据过滤
 *
 * @author luck
 */
@Mapper
@DataSource("pgvector")
public interface VectorDocumentMapper {

    /**
     * 插入或更新文档
     * 使用 ON CONFLICT 实现 upsert，冲突键为 id
     * 注意：已去掉content字段，全量内容存储在MySQL中
     *
     * @param row 文档行数据
     * @return 影响行数
     */
    @DataSource("pgvector")
    @Insert("INSERT INTO vector_document (id, vector, metadata, vector_type, created_at) " +
            "VALUES (#{id}, #{vector}::vector, #{metadata}::jsonb, #{vectorType}, NOW()) " +
            "ON CONFLICT (id) DO UPDATE SET " +
            "vector = EXCLUDED.vector, metadata = EXCLUDED.metadata, " +
            "vector_type = EXCLUDED.vector_type")
    int insertOrUpdate(VectorDocumentRow row);

    /**
     * 按文档ID列表删除
     *
     * @param ids 文档ID列表
     * @return 影响行数
     */
    @DataSource("pgvector")
    @Delete("<script>" +
            "DELETE FROM vector_document WHERE id IN " +
            "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    int deleteByIds(@Param("ids") List<String> ids);

    /**
     * 按向量类型删除文档
     *
     * @param vectorType 知识类型
     * @return 影响行数
     */
    @DataSource("pgvector")
    @Delete("DELETE FROM vector_document WHERE vector_type = #{vectorType}")
    int deleteByVectorType(@Param("vectorType") String vectorType);

    /**
     * 按向量类型和元数据 JSON 过滤删除文档
     * 使用 PostgreSQL 的 jsonb @> 操作符进行元数据包含匹配
     *
     * @param vectorType    知识类型
     * @param metadataJson  元数据过滤 JSON 字符串
     * @return 影响行数
     */
    @DataSource("pgvector")
    @Delete("DELETE FROM vector_document WHERE vector_type = #{vectorType} AND metadata @> #{metadataJson}::jsonb")
    int deleteByVectorTypeAndMetadata(@Param("vectorType") String vectorType,
                                      @Param("metadataJson") String metadataJson);

    /**
     * 按元数据 JSON 过滤删除文档（不限向量类型）
     *
     * @param metadataJson 元数据过滤 JSON 字符串
     * @return 影响行数
     */
    @DataSource("pgvector")
    @Delete("DELETE FROM vector_document WHERE metadata @> #{metadataJson}::jsonb")
    int deleteByMetadata(@Param("metadataJson") String metadataJson);

    /**
     * 向量相似度检索（仅按向量类型过滤）
     * 使用 pgvector 的余弦距离操作符 <=> 进行 ANN 检索
     * 注意：已去掉content字段，返回的content为空字符串
     *
     * @param queryVectorStr 查询向量字符串（pgvector 格式）
     * @param vectorType     知识类型
     * @param threshold      相似度阈值
     * @param topK           返回条数
     * @return 检索结果列表
     */
    @DataSource("pgvector")
    @Select("SELECT id, vector, metadata, vector_type, " +
            "1 - (vector <=> #{queryVectorStr}::vector) AS similarity " +
            "FROM vector_document " +
            "WHERE vector_type = #{vectorType} " +
            "AND 1 - (vector <=> #{queryVectorStr}::vector) >= #{threshold} " +
            "ORDER BY similarity DESC LIMIT #{topK}")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "vector", property = "vector"),
            @Result(column = "metadata", property = "metadata"),
            @Result(column = "vector_type", property = "vectorType"),
            @Result(column = "similarity", property = "similarity")
    })
    List<VectorDocumentRow> searchByVectorType(@Param("queryVectorStr") String queryVectorStr,
                                                @Param("vectorType") String vectorType,
                                                @Param("threshold") double threshold,
                                                @Param("topK") int topK);

    /**
     * 向量相似度检索（按向量类型 + 元数据过滤）
     * 先按 vectorType 和 metadata jsonb 过滤候选集，再计算余弦相似度
     * 注意：已去掉content字段，返回的content为空字符串
     *
     * @param queryVectorStr 查询向量字符串（pgvector 格式）
     * @param vectorType     知识类型
     * @param metadataJson   元数据过滤 JSON 字符串
     * @param threshold      相似度阈值
     * @param topK           返回条数
     * @return 检索结果列表
     */
    @DataSource("pgvector")
    @Select("SELECT id, vector, metadata, vector_type, " +
            "1 - (vector <=> #{queryVectorStr}::vector) AS similarity " +
            "FROM vector_document " +
            "WHERE vector_type = #{vectorType} " +
            "AND metadata @> #{metadataJson}::jsonb " +
            "AND 1 - (vector <=> #{queryVectorStr}::vector) >= #{threshold} " +
            "ORDER BY similarity DESC LIMIT #{topK}")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "vector", property = "vector"),
            @Result(column = "metadata", property = "metadata"),
            @Result(column = "vector_type", property = "vectorType"),
            @Result(column = "similarity", property = "similarity")
    })
    List<VectorDocumentRow> searchByVectorTypeAndMetadata(@Param("queryVectorStr") String queryVectorStr,
                                                           @Param("vectorType") String vectorType,
                                                           @Param("metadataJson") String metadataJson,
                                                           @Param("threshold") double threshold,
                                                           @Param("topK") int topK);

    /**
     * 向量相似度检索（仅按元数据过滤，不限向量类型）
     * 注意：已去掉content字段，返回的content为空字符串
     *
     * @param queryVectorStr 查询向量字符串（pgvector 格式）
     * @param metadataJson   元数据过滤 JSON 字符串
     * @param threshold      相似度阈值
     * @param topK           返回条数
     * @return 检索结果列表
     */
    @DataSource("pgvector")
    @Select("SELECT id, vector, metadata, vector_type, " +
            "1 - (vector <=> #{queryVectorStr}::vector) AS similarity " +
            "FROM vector_document " +
            "WHERE metadata @> #{metadataJson}::jsonb " +
            "AND 1 - (vector <=> #{queryVectorStr}::vector) >= #{threshold} " +
            "ORDER BY similarity DESC LIMIT #{topK}")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "vector", property = "vector"),
            @Result(column = "metadata", property = "metadata"),
            @Result(column = "vector_type", property = "vectorType"),
            @Result(column = "similarity", property = "similarity")
    })
    List<VectorDocumentRow> searchByMetadata(@Param("queryVectorStr") String queryVectorStr,
                                              @Param("metadataJson") String metadataJson,
                                              @Param("threshold") double threshold,
                                              @Param("topK") int topK);

    /**
     * 无过滤条件的向量相似度检索
     * 注意：已去掉content字段，返回的content为空字符串
     *
     * @param queryVectorStr 查询向量字符串（pgvector 格式）
     * @param threshold      相似度阈值
     * @param topK           返回条数
     * @return 检索结果列表
     */
    @DataSource("pgvector")
    @Select("SELECT id, vector, metadata, vector_type, " +
            "1 - (vector <=> #{queryVectorStr}::vector) AS similarity " +
            "FROM vector_document " +
            "WHERE 1 - (vector <=> #{queryVectorStr}::vector) >= #{threshold} " +
            "ORDER BY similarity DESC LIMIT #{topK}")
    @Results({
            @Result(column = "id", property = "id"),
            @Result(column = "vector", property = "vector"),
            @Result(column = "metadata", property = "metadata"),
            @Result(column = "vector_type", property = "vectorType"),
            @Result(column = "similarity", property = "similarity")
    })
    List<VectorDocumentRow> searchWithoutFilter(@Param("queryVectorStr") String queryVectorStr,
                                                 @Param("threshold") double threshold,
                                                 @Param("topK") int topK);
}
