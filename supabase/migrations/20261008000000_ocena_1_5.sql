-- Ocena stanja je od 1 do 5 (ocena 6 ne obstaja več).
-- 1 = uničeno, neuporabno, neurejeno; 2 = zelo rabljeno; 3 = vidno rabljeno;
-- 4 = očiščeno, skoraj novo, malo rabljeno; 5 = kot novo.
-- Garancija (rbo_prodaja.garancijski_rok_meseci) ostane v bazi enaka: 0 = brez, aplikacija ponuja 6, 12 ali 24 mesecev;
-- morebitne drugačne obstoječe vrednosti se ohranijo, dokler jih uporabnik ne spremeni.

-- 1) Obstoječe ocene 6 -> 5
update public.rbo_oprema set ocena = 5 where ocena = 6;

-- 2) Odstrani stari check (1-6) ne glede na ime omejitve in dodaj novega (1-5)
do $$
declare
    c text;
begin
    for c in
        select conname from pg_constraint
        where conrelid = 'public.rbo_oprema'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%ocena%'
    loop
        execute format('alter table public.rbo_oprema drop constraint %I', c);
    end loop;
end $$;

alter table public.rbo_oprema add constraint rbo_oprema_ocena_check check (ocena between 1 and 5);
