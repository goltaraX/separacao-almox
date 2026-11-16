# Almox • Materiais da Manutenção

Aplicativo web responsivo para solicitar, separar, entregar e consultar retiradas de materiais da manutenção.

## Executar localmente

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

## Acesso inicial

- Solicitante: qualquer nome, sem PIN.
- Almoxarifado: PIN inicial `2468` (troque em Configurações).

## Dados

Esta versão funciona offline e salva dados no `localStorage` do navegador. Use **Configurações > Exportar backup** para transferir dados. Para uso multiusuário entre dispositivos, publique o mesmo front-end conectado a um banco/autenticação corporativa antes de produção.

## Teams

Em Configurações, informe a URL de um Workflow do Teams com o gatilho “Quando uma solicitação de webhook do Teams for recebida”. Em produção, recomenda-se ocultar essa URL atrás de uma função de servidor.

## Publicação estática

O diretório pode ser publicado diretamente no GitHub Pages, Cloudflare Pages, Azure Static Web Apps ou outro host estático.
