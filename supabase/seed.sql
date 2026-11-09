-- Seed de exemplo para testar o portal localmente.
-- Rode DEPOIS da migration. Gera 1 agência, 1 cliente e alguns posts.
-- Ao final, imprime o portal_token do cliente para você montar a URL /portal/<token>.

insert into agencies (id, nome, cor_primaria)
values ('00000000-0000-0000-0000-0000000000a1', 'Minha Agência', '#7C3AED');

insert into clients (id, agency_id, nome)
values ('00000000-0000-0000-0000-0000000000c1',
        '00000000-0000-0000-0000-0000000000a1',
        'Cliente Demo');

insert into contents (client_id, tema, legenda, status, formato, canal, data_agendada)
values
  ('00000000-0000-0000-0000-0000000000c1', 'Gancho sobre produtividade',
   'Comenta aqui o que achou 👇 #produtividade', 'em_aprovacao', 'reels', 'instagram',
   date_trunc('month', now()) + interval '2 days'),
  ('00000000-0000-0000-0000-0000000000c1', 'Carrossel de dicas',
   '5 dicas rápidas', 'aprovado', 'carrossel', 'instagram',
   date_trunc('month', now()) + interval '9 days'),
  ('00000000-0000-0000-0000-0000000000c1', 'Story enquete',
   'Qual tema você quer ver?', 'ajuste', 'story', 'instagram',
   date_trunc('month', now()) + interval '15 days');

-- pegue o token para a URL do portal:
select 'Portal URL => /portal/' || portal_token as portal_url
from clients where id = '00000000-0000-0000-0000-0000000000c1';
