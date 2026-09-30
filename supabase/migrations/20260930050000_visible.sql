-- "Brisanje" brez brisanja vrstic: visible = true (DA) ob vnosu, false (NE) po izbrisu v aplikaciji.
-- Izbrisane vrstice ostanejo v bazi, aplikacija jih ne prikazuje.

alter table public.rbo_oprema  add column if not exists visible boolean not null default true;
alter table public.rbo_prodaja add column if not exists visible boolean not null default true;

create index if not exists rbo_oprema_visible_idx on public.rbo_oprema (visible);

-- Pogled prikazuje samo vidno opremo in vidne prodaje
create or replace view public.v_rbo_oprema_prodaja
with (security_invoker = true) as
select
    o.id                      as id_oprema,
    o.datum_prejema,
    ps.ime_slike              as predstavna_slika,
    o.kolicina,
    o.em,
    o.koda,
    o.serijska_stevilka,
    o.leto_proizvodnje,
    o.skupina_opreme,
    o.oprema_naziv,
    o.lastnistvo,
    o.skladisce,
    o.komentar,
    o.ocena,
    p.id_prodaja,
    p.imenovani_prodajalec,
    p.garancijski_rok_meseci,
    p.cena_nove,
    p.rabat_procent,
    p.prodajna_cena,
    p.datum_prodaje,
    p.komentar_ob_prodaji,
    p.status_prodaje
from public.rbo_oprema o
left join public.rbo_slike ps on ps.id_oprema = o.id and ps.vrsta_slike = 'Predstavna'
left join lateral (
    select pr.*
    from public.ln_rbo_oprema_prodaja po
    join public.rbo_prodaja pr on pr.id_prodaja = po.id_prodaja
    where po.id_oprema = o.id and pr.visible
    order by pr.id_prodaja desc
    limit 1
) p on true
where o.visible;
