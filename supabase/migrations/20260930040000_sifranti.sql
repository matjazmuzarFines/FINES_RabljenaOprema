-- Šifranti za spustne sezname v aplikaciji (Excel: list SIFRANTI)
-- Status prodaje, ocena (1–6) in EM so fiksni in so omejeni s check constrainti na tabelah.

do $$
declare
    t text;
begin
    foreach t in array array['rbo_sif_skupina_opreme', 'rbo_sif_lastnistvo', 'rbo_sif_skladisce', 'rbo_sif_prodajalec'] loop
        execute format('create table if not exists public.%I (naziv text primary key, vrstni_red smallint not null default 100)', t);
        execute format('alter table public.%I enable row level security', t);
        execute format('drop policy if exists "fines beri" on public.%I', t);
        execute format('drop policy if exists "fines uredi" on public.%I', t);
        execute format('create policy "fines beri" on public.%I for select to authenticated using (public.rbo_je_fines_uporabnik())', t);
        execute format('create policy "fines uredi" on public.%I for all to authenticated using (public.rbo_je_fines_uporabnik()) with check (public.rbo_je_fines_uporabnik())', t);
    end loop;
end $$;

insert into public.rbo_sif_skupina_opreme (naziv, vrstni_red) values
    ('Peč pica', 1),
    ('Peč etažna', 2),
    ('Peč konvekcijska', 3),
    ('Peč gastro-konvektomat', 4),
    ('Peč hitra', 5),
    ('Vzhajalnik / Nevtralna oprema', 6),
    ('Napa', 7),
    ('Ostalo', 8)
on conflict (naziv) do nothing;

insert into public.rbo_sif_lastnistvo (naziv, vrstni_red) values
    ('FINES', 1),
    ('NEURADNO', 2),
    ('TUJE', 3),
    ('TUJE - Lena d.o.o.', 4),
    ('TUJE - Koren', 5),
    ('TUJE - Romeo Plus', 6),
    ('TUJE - Wachtel', 7),
    ('TUJE - Mercedes bar', 8),
    ('TUJE - Zendelli', 9)
on conflict (naziv) do nothing;

-- Poleg vrednosti iz šifranta še vrednosti, ki so v podatkih (ERP; 13 in ERP; 20)
insert into public.rbo_sif_skladisce (naziv, vrstni_red) values
    ('ERP; 13; TRGOVSKO', 1),
    ('ERP; 14; RAZVOJ', 2),
    ('ERP; 15; RABLJENO', 3),
    ('ERP; 20; PROIZVOD', 4),
    ('SELA', 5),
    ('FINES', 6),
    ('VIR', 7),
    ('NEURADNO', 8)
on conflict (naziv) do nothing;

insert into public.rbo_sif_prodajalec (naziv, vrstni_red) values
    ('Jurjevčič Rok', 1),
    ('Kranjc Andrej', 2),
    ('Starman Jure', 3),
    ('Prodaja', 4)
on conflict (naziv) do nothing;
