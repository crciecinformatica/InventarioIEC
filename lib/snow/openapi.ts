export const snowOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API SNOW - Inventário CRC',
    version: '1.0.0',
    description:
      'Documentação dos endpoints de integração SNOW, processamento de planilhas XLSX e consulta da guia Snow.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Ambiente local',
    },
  ],
  tags: [
    {
      name: 'SNOW - Chamadas externas',
      description:
        'Endpoints chamados por automações externas, como Power Automate e integrações do Planner. Usam `SNOW_INTEGRATION_TOKEN` via Bearer token ou `x-api-key`.',
    },
    {
      name: 'SNOW - Chamadas internas',
      description:
        'Endpoints usados pela interface autenticada do inventário para consultar overview, solicitações e itens processados. Usam sessão do sistema.',
    },
  ],
  'x-tagGroups': [
    {
      name: 'Integrações externas',
      tags: ['SNOW - Chamadas externas'],
    },
    {
      name: 'Sistema interno',
      tags: ['SNOW - Chamadas internas'],
    },
  ],
  paths: {
    '/api/snow/processar-xlsx': {
      post: {
        tags: ['SNOW - Chamadas externas'],
        summary: 'Processar relatório XLSX do SNOW',
        description:
          'Recebe um arquivo `.xlsx` enviado pelo Power Automate, identifica o tipo de relatório, cruza IP/hostname com o inventário, aplica quarentena e registra o histórico.',
        security: [{ snowBearerAuth: [] }, { snowApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Arquivo XLSX recebido do SNOW.',
                  },
                  origem_email: {
                    type: 'string',
                    nullable: true,
                    example: 'smcgti.snow@pucminas.br',
                    default: 'smcgti.snow@pucminas.br',
                  },
                  assunto_email: {
                    type: 'string',
                    nullable: true,
                    example: '[PSG]Ativos descobertos que não são inventariados',
                  },
                  recebido_em: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    example: '2026-06-08T09:30:00-03:00',
                    description: 'Campo legado opcional. O histórico operacional usa a data/hora real em que o POST chegou à API.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Relatório processado com sucesso.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SnowProcessamentoResposta' },
              },
            },
          },
          '400': {
            description:
              'Arquivo ausente, extensão inválida, planilha vazia, relatório não identificado ou layout sem IP/hostname.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Token de integração ausente ou inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: 'Erro interno ao processar relatório SNOW.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/overview': {
      get: {
        tags: ['SNOW - Chamadas internas'],
        summary: 'Consultar métricas da guia Snow',
        description:
          'Retorna os totais agregados exibidos no overview da guia Snow. Requer sessão autenticada no sistema.',
        security: [{ nextAuthSession: [] }],
        parameters: [
          {
            name: 'inicio',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial do filtro por criação da solicitação.',
          },
          {
            name: 'fim',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final do filtro por criação da solicitação.',
          },
        ],
        responses: {
          '200': {
            description: 'Métricas retornadas com sucesso.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SnowOverview' },
              },
            },
          },
          '401': {
            description: 'Usuário não autenticado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/count': {
      get: {
        tags: ['SNOW - Chamadas internas'],
        summary: 'Contar solicitações SNOW pendentes',
        description:
          'Retorna quantas solicitações SNOW ainda possuem pelo menos uma máquina encontrada sem `planner_status = concluido`. Máquinas em quarentena são apenas controle operacional e não entram no atendimento do Planner.',
        security: [{ nextAuthSession: [] }],
        responses: {
          '200': {
            description: 'Contagem retornada com sucesso.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 3 },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Usuário não autenticado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/solicitacoes': {
      get: {
        tags: ['SNOW - Chamadas internas'],
        summary: 'Listar solicitações SNOW',
        description:
          'Lista solicitações SNOW processadas, com paginação e filtros usados pela interface `/snow`. Requer sessão autenticada no sistema.',
        security: [{ nextAuthSession: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Página atual.',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Quantidade de registros por página.',
          },
          {
            name: 'tipo',
            in: 'query',
            schema: { $ref: '#/components/schemas/TipoRelatorioSnow' },
            description: 'Filtra pelo tipo de relatório SNOW.',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['processado', 'erro_processamento'],
            },
            description: 'Filtra pelo status de processamento.',
          },
          {
            name: 'inicio',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial do filtro por `criado_em`.',
          },
          {
            name: 'fim',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final do filtro por `criado_em`.',
          },
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Busca por arquivo, origem, assunto, IP ou hostname.',
          },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de solicitações.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'total', 'page', 'totalPages'],
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SnowSolicitacao' },
                    },
                    total: { type: 'integer', example: 33 },
                    page: { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 2 },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Usuário não autenticado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/solicitacoes/{id}': {
      get: {
        tags: ['SNOW - Chamadas internas'],
        summary: 'Consultar detalhe de solicitação SNOW',
        description:
          'Retorna uma solicitação SNOW e todos os itens processados. Requer sessão autenticada no sistema.',
        security: [{ nextAuthSession: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID da solicitação SNOW.',
          },
        ],
        responses: {
          '200': {
            description: 'Detalhe da solicitação.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SnowSolicitacaoDetalhe' },
              },
            },
          },
          '401': {
            description: 'Usuário não autenticado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Solicitação SNOW não encontrada.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/itens': {
      get: {
        tags: ['SNOW - Chamadas internas'],
        summary: 'Listar itens SNOW por máquina',
        description:
          'Lista itens processados do SNOW para a visão por máquinas/chamados da guia Snow. Por padrão retorna máquinas encontradas e em quarentena. Requer sessão autenticada no sistema.',
        security: [{ nextAuthSession: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Página atual.',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Quantidade de registros por página.',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              example: 'atendida,em_quarentena',
            },
            description: 'Lista separada por vírgulas com os status dos itens.',
          },
          {
            name: 'planner_status',
            in: 'query',
            schema: {
              type: 'string',
              example: 'pendente,concluido',
            },
            description: 'Lista separada por vírgulas com status de acompanhamento do Planner.',
          },
          {
            name: 'inicio',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial do filtro por criação do item.',
          },
          {
            name: 'fim',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final do filtro por criação do item.',
          },
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string' },
            description: 'Busca por IP, hostname, colaborador, atendente, código de pessoa ou arquivo.',
          },
        ],
        responses: {
          '200': {
            description: 'Lista paginada de itens SNOW.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'total', 'page', 'totalPages'],
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SnowItemComSolicitacao' },
                    },
                    total: { type: 'integer', example: 48 },
                    page: { type: 'integer', example: 1 },
                    totalPages: { type: 'integer', example: 3 },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Usuário não autenticado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/itens/{id}/assumir': {
      post: {
        tags: ['SNOW - Chamadas externas'],
        summary: 'Registrar atendente do item SNOW no Planner',
        description:
          'Recebe o atendente que assumiu o chamado no Planner para a máquina atendida. Use o `id` do item retornado em `sections[].itens[].id` no processamento XLSX.',
        security: [{ snowBearerAuth: [] }, { snowApiKey: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID do item SNOW retornado em `sections[].itens[].id`.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SnowPlannerAssumirPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Atendente registrado com sucesso.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SnowPlannerAcompanhamento' },
              },
            },
          },
          '400': {
            description: 'Payload inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Token de integração ausente ou inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Item SNOW não encontrado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/snow/itens/{id}/concluir': {
      post: {
        tags: ['SNOW - Chamadas externas'],
        summary: 'Marcar item SNOW como concluído no Planner',
        description:
          'Marca como concluída a solicitação operacional daquela máquina após a conclusão do chamado no Planner.',
        security: [{ snowBearerAuth: [] }, { snowApiKey: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID do item SNOW retornado em `sections[].itens[].id`.',
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SnowPlannerConcluirPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item marcado como concluído com sucesso.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SnowPlannerAcompanhamento' },
              },
            },
          },
          '401': {
            description: 'Token de integração ausente ou inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Item SNOW não encontrado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      snowBearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description:
          'Token estático configurado em `SNOW_INTEGRATION_TOKEN`. Usado pelo Power Automate.',
      },
      snowApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description:
          'Alternativa ao Bearer token. Envie o mesmo valor configurado em `SNOW_INTEGRATION_TOKEN`.',
      },
      nextAuthSession: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description:
          'Sessão do usuário autenticado no inventário. Em produção pode usar cookie seguro `__Secure-next-auth.session-token`.',
      },
    },
    schemas: {
      TipoRelatorioSnow: {
        type: 'string',
        enum: [
          'ativos_nao_inventariados',
          'computadores_fora_organizacao',
          'computadores_a_serem_arquivados',
        ],
      },
      StatusItemSnow: {
        type: 'string',
        enum: [
          'atendida',
          'nao_atendida',
          'em_quarentena',
          'inconsistente',
          'erro_processamento',
        ],
      },
      SnowItemProcessado: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description:
              'ID do item SNOW. Use este valor nos endpoints de assumir/concluir integração com Planner.',
          },
          solicitacao_snow_id: { type: 'string', format: 'uuid' },
          ip: { type: 'string', nullable: true, example: '10.145.18.32' },
          hostname: { type: 'string', nullable: true, example: 'SGBIECADMI08032' },
          status: { $ref: '#/components/schemas/StatusItemSnow' },
          motivo: {
            type: 'string',
            example: 'Máquina encontrada por IP e hostname e fora da quarentena',
          },
          maquina_id: { type: 'string', format: 'uuid', nullable: true },
          colaborador_alocado: { type: 'string', nullable: true, example: 'Nome' },
          setor_alocado: { type: 'string', nullable: true, example: 'IEC' },
          localidade_alocada: { type: 'string', nullable: true, example: 'São Gabriel' },
          ultima_revisao: { type: 'string', format: 'date', nullable: true },
          data_ultima_solicitacao: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          bloqueado_ate: { type: 'string', format: 'date-time', nullable: true },
          planner_status: {
            type: 'string',
            enum: ['pendente', 'assumido', 'concluido'],
            example: 'pendente',
          },
          planner_task_id: { type: 'string', nullable: true },
          atendente_nome: { type: 'string', nullable: true },
          atendente_codigo_pessoa: { type: 'string', nullable: true },
          assumido_em: { type: 'string', format: 'date-time', nullable: true },
          concluido_em: { type: 'string', format: 'date-time', nullable: true },
          conclusao_observacao: { type: 'string', nullable: true },
          planner_atualizado_em: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      SnowItemComSolicitacao: {
        allOf: [
          { $ref: '#/components/schemas/SnowItemProcessado' },
          {
            type: 'object',
            properties: {
              solicitacao_snow: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nome_arquivo: { type: 'string' },
                  tipo_arquivo: { $ref: '#/components/schemas/TipoRelatorioSnow' },
                  origem_email: { type: 'string', nullable: true },
                  recebido_em: { type: 'string', format: 'date-time', nullable: true },
                  criado_em: { type: 'string', format: 'date-time', nullable: true },
                },
              },
              maquina: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nome_host: { type: 'string', nullable: true },
                  endereco_ip: { type: 'string', nullable: true },
                  identificador: { type: 'string', nullable: true },
                },
              },
            },
          },
        ],
      },
      SnowPlannerAssumirPayload: {
        type: 'object',
        required: ['atendente_nome', 'atendente_codigo_pessoa'],
        properties: {
          atendente_nome: {
            type: 'string',
            example: 'João Victor',
          },
          atendente_codigo_pessoa: {
            type: 'string',
            example: '123456',
          },
          planner_task_id: {
            type: 'string',
            nullable: true,
            example: 'AAMkAGI2...',
          },
          assumido_em: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-06-08T10:30:00-03:00',
          },
        },
      },
      SnowPlannerConcluirPayload: {
        type: 'object',
        properties: {
          atendente_nome: {
            type: 'string',
            nullable: true,
            example: 'João Victor',
          },
          atendente_codigo_pessoa: {
            type: 'string',
            nullable: true,
            example: '123456',
          },
          planner_task_id: {
            type: 'string',
            nullable: true,
            example: 'AAMkAGI2...',
          },
          concluido_em: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-06-08T12:00:00-03:00',
          },
          observacao: {
            type: 'string',
            nullable: true,
            example: 'Agente validado e chamado encerrado no Planner.',
          },
        },
      },
      SnowPlannerAcompanhamento: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          planner_status: {
            type: 'string',
            enum: ['pendente', 'assumido', 'concluido'],
          },
          planner_task_id: { type: 'string', nullable: true },
          atendente_nome: { type: 'string', nullable: true },
          atendente_codigo_pessoa: { type: 'string', nullable: true },
          assumido_em: { type: 'string', format: 'date-time', nullable: true },
          concluido_em: { type: 'string', format: 'date-time', nullable: true },
          conclusao_observacao: { type: 'string', nullable: true },
          planner_atualizado_em: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      SnowProcessamentoResposta: {
        type: 'object',
        required: [
          'arquivo',
          'tipo_relatorio',
          'resumo',
          'sections',
        ],
        properties: {
          arquivo: {
            type: 'string',
            example:
              '2026-06-02 - [PSG] Computadores à serem arquivados.xlsx',
          },
          tipo_relatorio: { $ref: '#/components/schemas/TipoRelatorioSnow' },
          resumo: {
            type: 'object',
            required: [
              'total_recebido',
              'atendidas',
              'nao_atendidas',
              'em_quarentena',
              'inconsistentes',
            ],
            properties: {
              total_recebido: { type: 'integer', example: 16 },
              atendidas: { type: 'integer', example: 4 },
              nao_atendidas: { type: 'integer', example: 12 },
              em_quarentena: { type: 'integer', example: 0 },
              inconsistentes: { type: 'integer', example: 0 },
            },
          },
          sections: {
            type: 'array',
            description:
              'Seções pensadas para o Power Automate. Por padrão carrega apenas `atendidas` e `inconsistentes`; não atendidas e quarentena ficam no histórico/interface.',
            items: {
              type: 'object',
              required: ['key', 'titulo', 'descricao', 'total', 'itens'],
              properties: {
                key: {
                  type: 'string',
                  enum: ['atendidas', 'inconsistentes'],
                  example: 'atendidas',
                },
                titulo: {
                  type: 'string',
                  example: 'Máquinas atendidas',
                },
                descricao: {
                  type: 'string',
                  example:
                    'Máquinas encontradas no inventário e liberadas para abertura de chamado no Planner.',
                },
                total: { type: 'integer', example: 4 },
                itens: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SnowItemProcessado' },
                },
              },
            },
          },
        },
      },
      SnowOverview: {
        type: 'object',
        properties: {
          total_solicitacoes: { type: 'integer', example: 10 },
          total_itens: { type: 'integer', example: 330 },
          atendidas: { type: 'integer', example: 120 },
          nao_atendidas: { type: 'integer', example: 180 },
          em_quarentena: { type: 'integer', example: 30 },
          inconsistentes: { type: 'integer', example: 0 },
          planner_pendentes: { type: 'integer', example: 12 },
          planner_em_atendimento: { type: 'integer', example: 3 },
          planner_resolvidas: { type: 'integer', example: 4 },
          por_tipo: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tipo_arquivo: { $ref: '#/components/schemas/TipoRelatorioSnow' },
                _count: { type: 'object' },
                _sum: { type: 'object' },
              },
            },
          },
        },
      },
      SnowSolicitacao: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome_arquivo: { type: 'string' },
          tipo_arquivo: { $ref: '#/components/schemas/TipoRelatorioSnow' },
          assunto_email: { type: 'string', nullable: true },
          origem_email: { type: 'string', nullable: true },
          recebido_em: { type: 'string', format: 'date-time', nullable: true },
          total_recebido: { type: 'integer' },
          total_atendidas: { type: 'integer' },
          total_nao_atendidas: { type: 'integer' },
          total_quarentena: { type: 'integer' },
          total_inconsistentes: { type: 'integer' },
          status_processamento: {
            type: 'string',
            enum: ['processado', 'erro_processamento'],
          },
          erro_processamento: { type: 'string', nullable: true },
          criado_em: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      SnowSolicitacaoDetalhe: {
        allOf: [
          { $ref: '#/components/schemas/SnowSolicitacao' },
          {
            type: 'object',
            properties: {
              itens: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: '#/components/schemas/SnowItemProcessado' },
                    {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        solicitacao_snow_id: { type: 'string', format: 'uuid' },
                        criado_em: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                        },
                        maquina: {
                          type: 'object',
                          nullable: true,
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            nome_host: { type: 'string', nullable: true },
                            endereco_ip: { type: 'string', nullable: true },
                            identificador: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Erro interno' },
        },
      },
    },
  },
} as const
