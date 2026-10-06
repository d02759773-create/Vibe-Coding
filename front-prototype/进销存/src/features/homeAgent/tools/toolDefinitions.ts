export const agentToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'clarify',
      description:
        '向用户提问以消除歧义或补齐信息。支持单题、批量独立题(questions 2-5)、选择题(最多4项)或开放式。任务含糊、缺时间范围/单号/模块/数据源时必须调用。',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '单个问题（与 questions 二选一）' },
          choices: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4,
            description: '最多4项；UI 追加「其他」。省略则为开放式。',
          },
          questions: {
            type: 'array',
            maxItems: 5,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                question: { type: 'string' },
                choices: { type: 'array', items: { type: 'string' }, maxItems: 4 },
                allowMultiple: { type: 'boolean' },
              },
              required: ['id', 'question'],
            },
          },
          recommendedChoiceIndex: { type: 'integer' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate',
      description: '跳转到进销存系统页面。path 为 hash 路由路径，如 /master/products',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '路由 path，以 / 开头' },
          query: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'URL 查询参数',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_route_catalog',
      description: '获取系统可访问页面路由列表',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirm_action',
      description:
        '写操作或敏感操作前必须调用，等待用户在弹窗中确认后再执行。用于停用主数据、导出批量数据等。不要用于简单 yes/no 的闲聊确认。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '弹窗标题' },
          description: { type: 'string', description: '说明风险与将要执行的操作' },
          action: {
            type: 'string',
            enum: ['disable_master', 'export_entity_json', 'create_purchase_order'],
          },
          params: {
            type: 'object',
            description:
              'disable_master / export_entity_json / create_purchase_order（见 create_purchase_order 工具字段）',
          },
        },
        required: ['title', 'description', 'action', 'params'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_purchase_order',
      description:
        '创建采购订单并写入系统（需用户弹窗确认）。supplierId/warehouseId/productId 须来自 query_master_list。submitForAudit=true 保存为待审核，false 为草稿。',
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string' },
          warehouseId: { type: 'string' },
          orderDate: { type: 'string', description: 'YYYY-MM-DD，默认今天' },
          expectedArrivalDate: { type: 'string', description: '可选 YYYY-MM-DD' },
          remark: { type: 'string' },
          submitForAudit: { type: 'boolean', description: 'true=提交审核 PENDING_AUDIT，false=草稿 DRAFT' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
                taxRate: { type: 'string', enum: ['', '0%', '3%', '6%', '9%', '13%'] },
                lineRemark: { type: 'string' },
              },
              required: ['productId', 'quantity'],
            },
          },
        },
        required: ['supplierId', 'warehouseId', 'lines'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_master_list',
      description: '只读查询系统 Mock 主数据或订单列表',
      parameters: {
        type: 'object',
        properties: {
          entity: {
            type: 'string',
            enum: ['products', 'customers', 'suppliers', 'warehouses', 'purchase_orders'],
          },
          keyword: { type: 'string', description: '模糊匹配名称或编码' },
          limit: { type: 'integer', description: '返回条数上限，默认 20' },
        },
        required: ['entity'],
      },
    },
  },
] as const
