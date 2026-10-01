-- Uporabnik "samo ogled" (npr. finesview@fines.si): bere vse, ne more dodajati, urejati ali brisati.
-- Vloga je v app_metadata uporabnika (uporabnik je sam ne more spremeniti): {"vloga": "ogled"}.

-- 1) Ali sme trenutni uporabnik spreminjati podatke
create or replace function public.rbo_lahko_ureja()
returns boolean
language sql
stable
as $$
    select public.rbo_je_fines_uporabnik()
       and coalesce(auth.jwt() -> 'app_metadata' ->> 'vloga', '') <> 'ogled'
$$;

-- 2) Pravila za pisanje v tabelah: rbo_lahko_ureja() namesto rbo_je_fines_uporabnik() (branje ostane enako)
do $$
declare
    t text;
begin
    foreach t in array array['rbo_oprema', 'rbo_prodaja', 'ln_rbo_oprema_prodaja', 'rbo_slike', 'rbo_kartoteka', 'rbo_tehnicni_list'] loop
        execute format('drop policy if exists "fines dodaj" on public.%I', t);
        execute format('drop policy if exists "fines uredi" on public.%I', t);
        execute format('create policy "fines dodaj" on public.%I for insert to authenticated with check (public.rbo_lahko_ureja())', t);
        execute format('create policy "fines uredi" on public.%I for update to authenticated using (public.rbo_lahko_ureja()) with check (public.rbo_lahko_ureja())', t);
    end loop;

    foreach t in array array['ln_rbo_oprema_prodaja', 'rbo_slike'] loop
        execute format('drop policy if exists "fines izbrisi" on public.%I', t);
        execute format('create policy "fines izbrisi" on public.%I for delete to authenticated using (public.rbo_lahko_ureja())', t);
    end loop;

    -- šifranti: "fines uredi" velja za vse operacije; branje omogoča ločeno pravilo "fines beri"
    foreach t in array array['rbo_sif_skupina_opreme', 'rbo_sif_lastnistvo', 'rbo_sif_skladisce', 'rbo_sif_prodajalec'] loop
        execute format('drop policy if exists "fines uredi" on public.%I', t);
        execute format('create policy "fines uredi" on public.%I for all to authenticated using (public.rbo_lahko_ureja()) with check (public.rbo_lahko_ureja())', t);
    end loop;
end $$;

-- 3) Storage: nalaganje, zamenjava in brisanje slik samo za uporabnike z urejanjem
drop policy if exists "rbo slike dodaj" on storage.objects;
drop policy if exists "rbo slike uredi" on storage.objects;
drop policy if exists "rbo slike izbrisi" on storage.objects;

create policy "rbo slike dodaj" on storage.objects for insert to authenticated
    with check (bucket_id = 'Slike_rabljena_oprema' and public.rbo_lahko_ureja());
create policy "rbo slike uredi" on storage.objects for update to authenticated
    using (bucket_id = 'Slike_rabljena_oprema' and public.rbo_lahko_ureja());
create policy "rbo slike izbrisi" on storage.objects for delete to authenticated
    using (bucket_id = 'Slike_rabljena_oprema' and public.rbo_lahko_ureja());

-- 4) Uporabniku FINESVIEW dodeli vlogo "ogled".
--    Uporabnika najprej ustvari v Authentication -> Users (finesview@fines.si), nato poženi to vrstico.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"vloga": "ogled"}'::jsonb
where email = 'finesview@fines.si';
