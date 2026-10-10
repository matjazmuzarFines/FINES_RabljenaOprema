-- Odstranitev AI iskanja (obratno od migrations/20261010000000_ai_iskanje.sql).
-- Poženi v Supabase SQL Editorju. Ostalih podatkov ne spremeni; izbriše samo vektorje AI iskanja.

drop function if exists public.rbo_ai_isci(extensions.vector, integer);
drop table if exists public.rbo_ai_vektor;

-- Razširitev pgvector odstrani samo, če je ne uporablja nič drugega v bazi:
-- drop extension if exists vector;
