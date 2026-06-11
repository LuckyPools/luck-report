/**
 * 表达式对象数据模型 JSON Schema 定义
 */

/**
 * ExpressionObject 表达式对象 Schema
 */
export const ExpressionObjectSchema = {
  type: 'object',
  properties: {
    expr: { type: 'string', description: '表达式字符串，去除空格和换行后的紧凑形式' },
    expressionList: {
      type: 'array',
      description: '表达式列表，包含变量赋值、聚合函数调用等表达式片段',
      items: {
        type: 'object',
        properties: {
          expr: { type: 'string', description: '表达式片段，如"a=B2;"' },
          variable: { type: 'string', description: '变量名，如a、b、c、d' },
          expression: {
            type: 'object',
            description: '子表达式对象，可能是单元格引用、数据集聚合、函数调用等',
            properties: {
              expr: { type: 'string', description: '子表达式字符串' },
              cellName: { type: 'string', description: '单元格名称，如B2、C2' },
              datasetName: { type: 'string', description: '数据集名称' },
              aggregate: { type: 'string', description: '聚合方式，如max、sum' },
              property: { type: 'string', description: '字段名' },
              name: { type: 'string', description: '函数名称，如sum' },
              expressions: {
                type: 'array',
                description: '函数参数表达式列表',
                items: {
                  type: 'object',
                  properties: {
                    expr: { type: 'string', description: '参数表达式' },
                    cellName: { type: 'string', description: '单元格名称' }
                  }
                }
              },
              operators: {
                type: 'array',
                description: '运算符列表，如["Add","Add","Add"]',
                items: { type: 'string', enum: ['Add', 'Subtract', 'Multiply', 'Divide'] }
              },
              text: { type: 'string', description: '文本值，用于变量引用' },
              value: { type: 'number', description: '数值' }
            }
          },
          operators: {
            type: 'array',
            description: '运算符列表',
            items: { type: 'string', enum: ['Add', 'Subtract', 'Multiply', 'Divide'] }
          },
          expressions: {
            type: 'array',
            description: '表达式数组，用于运算表达式',
            items: {
              type: 'object',
              properties: {
                expr: { type: 'string', description: '表达式' },
                operators: { type: 'array', description: '运算符列表' },
                expressions: { type: 'array', description: '嵌套表达式列表' },
                text: { type: 'string', description: '文本值' },
                value: { type: 'number', description: '数值' }
              }
            }
          }
        }
      }
    },
    returnExpression: {
      type: 'object',
      description: '返回表达式，通常为null，表达式列表中最后一个表达式即为返回值',
      properties: {
        expr: { type: 'string', description: '返回表达式字符串' }
      }
    }
  },
  required: ['expr']
}