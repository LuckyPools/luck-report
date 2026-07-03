package com.luck.report.postgresql.vector.mapper;

import com.luck.report.infra.modules.vector.domain.entity.VectorDocumentRow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 向量文档 DAO
 * 使用 JdbcTemplate 操作 PostgreSQL 的 luck_vector_document 表
 * 通过 @Qualifier("vectorJdbcTemplate") 注入 plugin 内部专属 JdbcTemplate（plugin 自治）
 *
 * @author luck
 */
@Repository
public class PgSqlVectorDocumentDao {

    @Autowired
    @Qualifier("vectorJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    /**
     * 向量文档行映射器
     */
    private static final RowMapper<VectorDocumentRow> ROW_MAPPER = new RowMapper<VectorDocumentRow>() {
        @Override
        public VectorDocumentRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            VectorDocumentRow row = new VectorDocumentRow();
            row.setId(rs.getString("id"));
            row.setVector(rs.getString("vector"));
            row.setMetadata(rs.getString("metadata"));
            row.setVectorType(rs.getString("vector_type"));
            row.setSimilarity(rs.getDouble("similarity"));
            return row;
        }
    };

    public int insertOrUpdate(VectorDocumentRow row) {
        String sql = "INSERT INTO luck_vector_document (id, vector, metadata, vector_type, created_at) " +
                     "VALUES (?, ?::vector, ?::jsonb, ?, NOW()) " +
                     "ON CONFLICT (id) DO UPDATE SET " +
                     "vector = EXCLUDED.vector, metadata = EXCLUDED.metadata, " +
                     "vector_type = EXCLUDED.vector_type";
        return jdbcTemplate.update(sql, row.getId(), row.getVector(), row.getMetadata(), row.getVectorType());
    }

    public int deleteByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        String placeholders = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = "DELETE FROM luck_vector_document WHERE id IN (" + placeholders + ")";
        return jdbcTemplate.update(sql, ids.toArray());
    }

    public int deleteByVectorType(String vectorType) {
        String sql = "DELETE FROM luck_vector_document WHERE vector_type = ?";
        return jdbcTemplate.update(sql, vectorType);
    }

    public int deleteByVectorTypeAndMetadata(String vectorType, String metadataJson) {
        String sql = "DELETE FROM luck_vector_document WHERE vector_type = ? AND metadata @> ?::jsonb";
        return jdbcTemplate.update(sql, vectorType, metadataJson);
    }

    /**
     * 统一向量检索方法
     * 根据 vectorType、metadataJson、idMetaKey 动态拼接过滤条件
     *
     * @param queryVectorStr 查询向量字符串
     * @param vectorType 知识类型，为 null 表示不按类型过滤
     * @param metadataJson metadata JSON 过滤条件，为 null 表示不按 metadata 过滤
     * @param threshold 相似度阈值
     * @param topK 返回条数
     * @param idMetaKey metadata 中业务ID字段名，为 null 表示不按ID过滤
     * @param validIds 生效的业务ID列表
     * @return 向量文档行列表
     */
    public List<VectorDocumentRow> search(String queryVectorStr, String vectorType,
                                           String metadataJson, double threshold, int topK,
                                           String idMetaKey, List<String> validIds) {
        validateMetaKey(idMetaKey);

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT id, vector, metadata, vector_type, ");
        sql.append("1 - (vector <=> ?::vector) AS similarity ");
        sql.append("FROM luck_vector_document ");
        sql.append("WHERE 1 - (vector <=> ?::vector) >= ? ");

        List<Object> params = new ArrayList<>();
        params.add(queryVectorStr);
        params.add(queryVectorStr);
        params.add(threshold);

        // 追加 vectorType 条件
        if (vectorType != null && !vectorType.isEmpty()) {
            sql.append("AND vector_type = ? ");
            params.add(vectorType);
        }

        // 追加 metadata 等值条件（@> jsonb 包含匹配，支持多字段）
        if (metadataJson != null && !metadataJson.isEmpty()) {
            sql.append("AND metadata @> ?::jsonb ");
            params.add(metadataJson);
        }

        // 追加业务ID的 IN 过滤条件（idMetaKey 已做白名单校验，安全拼接）
        appendIdFilter(sql, params, idMetaKey, validIds);

        sql.append("ORDER BY similarity DESC LIMIT ?");
        params.add(topK);

        return jdbcTemplate.query(sql.toString(), ROW_MAPPER, params.toArray());
    }

    /**
     * 追加业务ID的 IN 过滤条件到 SQL 和参数列表
     * idMetaKey 为 null 或 validIds 为空时跳过；否则拼接 AND metadata->>'idMetaKey' IN (?, ...)
     *
     * @param sql SQL 构建器
     * @param params 参数列表
     * @param idMetaKey metadata 中业务ID字段名
     * @param validIds 生效的业务ID列表
     */
    private void appendIdFilter(StringBuilder sql, List<Object> params, String idMetaKey, List<String> validIds) {
        if (idMetaKey == null || validIds == null || validIds.isEmpty()) {
            return;
        }
        String placeholders = validIds.stream().map(v -> "?").collect(Collectors.joining(","));
        sql.append("AND metadata->>'").append(idMetaKey).append("' IN (").append(placeholders).append(") ");
        params.addAll(validIds);
    }

    /**
     * 校验 metadata 字段名合法性，防止 SQL 注入
     * 只允许字母、数字、下划线，且不能以数字开头
     *
     * @param metaKey metadata 字段名，为 null 时跳过校验
     * @throws IllegalArgumentException 如果字段名非法
     */
    private void validateMetaKey(String metaKey) {
        if (metaKey != null && !metaKey.matches("[a-zA-Z_][a-zA-Z0-9_]*")) {
            throw new IllegalArgumentException("非法的 metadata 字段名: " + metaKey);
        }
    }
}
