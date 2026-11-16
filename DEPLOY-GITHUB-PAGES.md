# Publicação no GitHub Pages

## Opção pelo navegador

1. Entre no GitHub com a conta que será responsável pelo site.
2. Crie um repositório, por exemplo `almox-manutencao`.
3. Faça upload de todos os arquivos desta pasta na raiz do repositório.
4. Abra **Settings > Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**.
6. Selecione a branch `main`, pasta `/ (root)` e salve.
7. O endereço será `https://SEU-USUARIO.github.io/almox-manutencao/`.
8. No Microsoft Entra/Power Automate, inclua esse endereço nas origens permitidas do Workflow.

## Opção por linha de comando

```bash
git init
git add .
git commit -m "Publica sistema de solicitações do almoxarifado"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/almox-manutencao.git
git push -u origin main
```

Depois, ative o GitHub Pages nas configurações do repositório.

## Observações

- O GitHub Pages hospeda o front-end gratuitamente, mas o repositório público não deve conter credenciais nem a URL secreta do Workflow.
- O site funciona em modo piloto mesmo sem Microsoft 365; nesse modo, os dados ficam apenas no navegador.
- O PIN local é uma conveniência visual, não substitui autenticação corporativa. Para produção, use o Workflow autenticado e permissões da lista.
