# Configuração do Microsoft 365

A lista corporativa **Almox - Solicitacoes Manutencao** foi criada no site **GRP-NLT-NVN-IND**.

- Site: `https://ldcom365.sharepoint.com/sites/GRP-NLT-NVN-IND`
- Lista: `https://ldcom365.sharepoint.com/sites/GRP-NLT-NVN-IND/Lists/Almox%20%20Solicitacoes%20Manutencao`
- ID da lista: `ce06a920-7fb3-4ba9-b82c-fc1710cbdbd9`

## Workflow usado como API

Crie um fluxo na solução Power Automate/Workflows com o gatilho **Quando uma solicitação HTTP for recebida**. O front-end envia JSON em `POST` com uma propriedade `action`.

### Esquema do gatilho

```json
{
  "type": "object",
  "properties": {
    "action": {"type": "string"},
    "actor": {"type": "string"},
    "request": {"type": "object"},
    "audit": {"type": "array"}
  },
  "required": ["action"]
}
```

## Ramo `action = list`

1. **Obter itens** da lista `Almox - Solicitacoes Manutencao`.
2. Use **Selecionar** para converter cada item para o formato do site. Campos principais:
   - `id` ← `SolicitacaoId`
   - `requester` ← `Solicitante`
   - `executor` ← `Executante`
   - `activity` ← `Atividade`
   - `os` ← `NumeroOS`
   - `type` ← `TipoSolicitacao`
   - `priority` ← `Prioridade`
   - `neededAt` ← `NecessarioAte`
   - `status` ← `StatusSolicitacao`
   - `notes` ← `Observacoes`
   - `separatedAt` ← `DataSeparacao`
   - `deliveredAt` ← `DataEntrega`
   - `updatedAt` ← `AtualizadoEm`
   - `items` ← `json(ItemsJson)`
3. Responda HTTP 200 com `{"requests": <saída do Selecionar>}`.
4. Inclua cabeçalhos de resposta `Content-Type: application/json` e `Access-Control-Allow-Origin` com o endereço exato do GitHub Pages.

## Ramo `action = upsert`

1. Consulte a lista filtrando `SolicitacaoId eq '<request.id>'`.
2. Se não existir, **Criar item**. Se existir, **Atualizar item**.
3. Use `Title = request.id + ' - ' + request.activity`.
4. Grave os campos da solicitação e:
   - `ItemsJson = string(request.items)`
   - `HistoricoJson = string(audit)`
   - `AtualizadoPor = actor`
5. Publique uma mensagem/cartão no chat em grupo **Solicitação de Separação Materiais - MANUT/ALMOX** com ID, atividade, OS, executante, status e quantidade de materiais.
6. Responda HTTP 200 com `{"ok": true}` e o mesmo cabeçalho de CORS.

## Segurança

- Restrinja o gatilho a usuários autenticados do locatário quando essa opção estiver disponível.
- Não grave a URL do Workflow no repositório público. O site a armazena apenas no navegador após ser colada em **Configurações > Histórico compartilhado no Microsoft 365**.
- Conceda edição da lista somente ao grupo do Almoxarifado; a Manutenção pode usar o fluxo para inclusão e leitura.
