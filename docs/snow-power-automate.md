# Integração SNOW via Power Automate

## Endpoint

`POST /api/snow/processar-xlsx`

## Autenticação

Enviar um token estático no header:

```http
Authorization: Bearer <SNOW_INTEGRATION_TOKEN>
```

O valor deve estar configurado no ambiente da aplicação como `SNOW_INTEGRATION_TOKEN`.

## Corpo da Requisição

Usar `multipart/form-data`:

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `file` | Sim | Anexo `.xlsx` recebido do SNOW |
| `origem_email` | Não | Remetente do e-mail processado |
| `assunto_email` | Não | Assunto do e-mail SNOW |
| `recebido_em` | Não | Data/hora ISO do recebimento |

## Exemplo de Retorno

```json
{
  "arquivo": "2026-06-02 - [PSG] Computadores à serem arquivados.xlsx",
  "tipo_relatorio": "computadores_a_serem_arquivados",
  "resumo": {
    "total_recebido": 16,
    "encontradas": 4,
    "nao_atendidas": 12,
    "em_quarentena": 0,
    "inconsistentes": 0
  },
  "sections": [
    {
      "key": "encontradas",
      "titulo": "Máquinas encontradas",
      "descricao": "Máquinas encontradas no inventário e liberadas para abertura de chamado no Planner.",
      "total": 4,
      "itens": []
    },
    {
      "key": "inconsistentes",
      "titulo": "Máquinas inconsistentes",
      "descricao": "Máquinas em que IP e hostname apontam divergência. Devem ser tratadas internamente no inventário.",
      "total": 0,
      "itens": []
    }
  ]
}
```

## Fluxo Power Automate

1. Monitorar a caixa ou pasta de e-mails do SNOW.
2. Validar remetente e assunto.
3. Filtrar anexos com extensão `.xlsx`.
4. Enviar o anexo para o endpoint usando uma ação HTTP com `multipart/form-data`.
5. Ler o JSON retornado.
6. Localizar em `sections` a seção com `key = "encontradas"`.
7. Iterar `sections[].itens` da seção `encontradas` para abertura de chamados no Planner.
8. Guardar no card/chamado do Planner o campo `id` do item SNOW.
9. Quando alguém assumir o chamado, chamar `POST /api/snow/itens/{id}/assumir`.
10. Quando o chamado for concluído, chamar `POST /api/snow/itens/{id}/concluir`.
11. Usar `resumo` apenas para métricas e controle operacional.

## Registrar atendente no Planner

`POST /api/snow/itens/{id}/assumir`

```json
{
  "atendente_nome": "João Victor",
  "atendente_codigo_pessoa": "123456",
  "planner_task_id": "AAMkAGI2...",
  "assumido_em": "2026-06-08T10:30:00-03:00"
}
```

## Marcar chamado como concluído

`POST /api/snow/itens/{id}/concluir`

```json
{
  "atendente_nome": "João Victor",
  "atendente_codigo_pessoa": "123456",
  "planner_task_id": "AAMkAGI2...",
  "concluido_em": "2026-06-08T12:00:00-03:00",
  "observacao": "Agente validado e chamado encerrado no Planner."
}
```

## Guia Snow

A interface do inventário disponibiliza a guia `Snow` em `Serviços`. Ela mostra o overview das solicitações recebidas, filtros por tipo/status/período/busca e o detalhe dos itens processados em cada solicitação.
