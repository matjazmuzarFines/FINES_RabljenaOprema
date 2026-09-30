-- Dostop Vercel aplikacije: samo prijavljeni uporabniki z e-mailom @fines.si

-- 1) Ali je trenutni uporabnik prijavljen s službenim e-mailom
create or replace function public.rbo_je_fines_uporabnik()
returns boolean
language sql
stable
as $$
    select coalesce(auth.jwt() ->> 'email', '') ilike '%@fines.si'
$$;

-- 2) Pravila (RLS) za tabele: branje, dodajanje, urejanje; brisanje samo za slike in povezave
do $$
declare
    t text;
begin
    foreach t in array array['rbo_oprema', 'rbo_prodaja', 'ln_rbo_oprema_prodaja', 'rbo_slike'] loop
        execute format('drop policy if exists "fines beri" on public.%I', t);
        execute format('drop policy if exists "fines dodaj" on public.%I', t);
        execute format('drop policy if exists "fines uredi" on public.%I', t);
        execute format('create policy "fines beri" on public.%I for select to authenticated using (public.rbo_je_fines_uporabnik())', t);
        execute format('create policy "fines dodaj" on public.%I for insert to authenticated with check (public.rbo_je_fines_uporabnik())', t);
        execute format('create policy "fines uredi" on public.%I for update to authenticated using (public.rbo_je_fines_uporabnik()) with check (public.rbo_je_fines_uporabnik())', t);
    end loop;

    foreach t in array array['ln_rbo_oprema_prodaja', 'rbo_slike'] loop
        execute format('drop policy if exists "fines izbrisi" on public.%I', t);
        execute format('create policy "fines izbrisi" on public.%I for delete to authenticated using (public.rbo_je_fines_uporabnik())', t);
    end loop;
end $$;

-- 3) Pravila za Storage bucket s slikami
--    !!! Bucket: 'Slike_rabljena_oprema' (slike so v korenu, brez podmap).
drop policy if exists "rbo slike beri" on storage.objects;
drop policy if exists "rbo slike dodaj" on storage.objects;
drop policy if exists "rbo slike uredi" on storage.objects;
drop policy if exists "rbo slike izbrisi" on storage.objects;

create policy "rbo slike beri" on storage.objects for select to authenticated
    using (bucket_id = 'Slike_rabljena_oprema' and public.rbo_je_fines_uporabnik());
create policy "rbo slike dodaj" on storage.objects for insert to authenticated
    with check (bucket_id = 'Slike_rabljena_oprema' and public.rbo_je_fines_uporabnik());
create policy "rbo slike uredi" on storage.objects for update to authenticated
    using (bucket_id = 'Slike_rabljena_oprema' and public.rbo_je_fines_uporabnik());
create policy "rbo slike izbrisi" on storage.objects for delete to authenticated
    using (bucket_id = 'Slike_rabljena_oprema' and public.rbo_je_fines_uporabnik());

-- 4) Pogled: vsak kos opreme natanko enkrat, z zadnjim prodajnim zapisom in predstavno sliko
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
    where po.id_oprema = o.id
    order by pr.id_prodaja desc
    limit 1
) p on true;
