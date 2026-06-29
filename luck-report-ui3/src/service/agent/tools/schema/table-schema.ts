/**
 * 数据源表结构相关工具的输出 JSON Schema
 * 供 LLM 在调用前预先理解工具返回值的字段含义
 *
 * 包含两个 schema：
 * - SchemaDTOSchema：get_table_relation 工具返回的 SchemaDTO 结构
 * - SchemaSearchResultSchema：search_schema 工具返回的搜索结果数组（嵌套引用 SchemaDTOSchema）
 */

export const SchemaDTOSchema = {
  type: 'object',
  description: '数据源Schema结构（包含表结构、字段、外键），用于构建SQL数据集',
  properties: {
    name: {
      type: 'string',
      description: '数据库名（如"order_db"），用于构造跨库SQL时识别数据源'
    },
    description: {
      type: 'string',
      description: '数据库描述，说明该数据库的业务用途（如"订单相关业务表"）'
    },
    tableCount: {
      type: 'integer',
      description: '召回的表数量'
    },
    table: {
      type: 'array',
      description: '命中的表结构列表（每项含 name/description/column/primaryKeys）',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '物理表名（如"t_user"），用于 SQL 的 FROM/JOIN 子句'
          },
          description: {
            type: 'string',
            description: '表的中文/业务描述（如"用户主表"），用于语义理解'
          },
          primaryKeys: {
            type: 'array',
            description: '主键字段名列表',
            items: { type: 'string' }
          },
          column: {
            type: 'array',
            description: '字段列表（每项含 name/type/description/data/enumeration/range/mapping）',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: '物理字段名（如"status"），用于 SQL 的 SELECT/WHERE/ORDER BY'
                },
                type: {
                  type: 'string',
                  description: '数据库字段类型（如"varchar(50)"、"decimal(18,2)"、"datetime"），用于决定算子/精度/字符集'
                },
                description: {
                  type: 'string',
                  description: '字段业务含义（如"订单状态：0-待支付 1-已支付 2-已取消"），推理 WHERE 条件时优先参考'
                },
                data: {
                  type: 'array',
                  description: '示例数据（前若干条真实值），用于推断枚举字段的可能取值',
                  items: { type: 'string' }
                },
                enumeration: {
                  type: 'integer',
                  description: '枚举标记。0=非枚举，1=枚举字段。枚举字段的取值范围应在 data/mapping 中'
                },
                range: {
                  type: 'string',
                  description: '值范围描述（如">=0 且 <=150"），用于推断边界条件'
                },
                mapping: {
                  type: 'object',
                  description: '状态码→状态名映射（如{"0":"禁用","1":"启用"}），用于把代码翻译成业务语言',
                  additionalProperties: { type: 'string' }
                }
              },
              required: ['name', 'type']
            }
          }
        },
        required: ['name', 'column']
      }
    },
    foreignKeys: {
      type: 'array',
      description: '外键关系列表（物理外键 + 逻辑外键合并），每项描述一对字段关联，用于推断 JOIN 条件',
      items: {
        type: 'object',
        properties: {
          sourceTable: {
            type: 'string',
            description: '源表名（如"t_order"）'
          },
          sourceColumn: {
            type: 'string',
            description: '源字段名（如"buyer_uid"）'
          },
          targetTable: {
            type: 'string',
            description: '目标表名（如"t_user"）'
          },
          targetColumn: {
            type: 'string',
            description: '目标字段名（如"id"）'
          }
        },
        required: ['sourceTable', 'sourceColumn', 'targetTable', 'targetColumn']
      }
    }
  },
  required: ['name', 'tableCount', 'table', 'foreignKeys']
}

export const SchemaSearchResultSchema = {
  type: 'array',
  description: '匹配的数据源Schema搜索结果列表（每项对应一个数据源），用于在多个数据源间定位包含相关表的数据源',
  items: {
    type: 'object',
    description: '单个数据源的搜索命中结果',
    properties: {
      datasourceId: {
        type: 'integer',
        description: '数据源ID（整数），用于后续 get_table_relation 工具的 datasourceId 参数'
      },
      datasourceName: {
        type: 'string',
        description: '数据源名称（如"orderDb"），用于自然语言引用，也是 get_table_relation 工具的 datasourceName 参数'
      },
      datasourceType: {
        type: 'string',
        description: '数据源类型（如 mysql/postgresql/oracle），用于判断 SQL 方言差异'
      },
      schema: {
        ...SchemaDTOSchema,
        description: '该数据源命中的 SchemaDTO（含表结构、字段、外键），详细字段含义见 SchemaDTOSchema'
      }
    },
    required: ['datasourceId', 'datasourceName', 'datasourceType', 'schema']
  }
}
