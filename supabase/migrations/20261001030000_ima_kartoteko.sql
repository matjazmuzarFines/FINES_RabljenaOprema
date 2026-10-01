-- Pogled: dodan stolpec ima_kartoteko (ali ima oprema vsaj en viden zapis v kartoteki).
-- Uporablja se za omogočanje gumba za prenos PDF kartoteke na seznamu opreme.

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
    p.status_prodaje,
    exists (select 1 from public.rbo_tehnicni_list tl where tl.id_oprema = o.id and tl.visible) as ima_tehnicni_list,
    exists (select 1 from public.rbo_kartoteka k where k.id_oprema = o.id and k.visible) as ima_kartoteko
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
