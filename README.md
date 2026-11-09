# Agenda Deluxe

Agenda online para profissionais autônomos (manicure, barbeiro, cabeleireira, personal…).

- **Link de agendamento**: o cliente escolhe serviço, dia e horário sozinho
- **Lembrete no WhatsApp** com link para o cliente confirmar ou desmarcar
- **Controle de pagamento** e resumo do mês (faturado, recebido, faltas)
- Funciona como app no celular (PWA)

## Estrutura
- `index.html` + `app.js` — painel da profissional
- `agendar.html?u=<link>` — página pública de agendamento
- `confirmar.html?id=<agendamento>` — cliente confirma/desmarca
- `config.js` — URL e chave publicável do Supabase
- Banco: tabelas `ad_*` no Supabase, protegidas por RLS; o cliente só acessa pelas funções `ad_pagina_publica`, `ad_horarios_livres`, `ad_agendar` e `ad_responder`.

Site estático: não precisa de build.
