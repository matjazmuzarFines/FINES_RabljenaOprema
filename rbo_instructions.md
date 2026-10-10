# Rabljena oprema (RBO) - posebnosti projekta

Skupna pravila so v `../FINES_Standardi/app_instructions.md` (uvoženo v `CLAUDE.md`). Tukaj so samo pravila tega projekta.

## Baza
- Tabele: `rbo_...`, povezovalne `ln_rbo_...`. Migracije so v `supabase/migrations/` in jih poženeš ročno v Supabase SQL Editorju.

## Ocena stanja
- Ocena je **od 1 do 5**, desno od lestvice / črtic je vedno opis ocene:
  1 = uničeno, neuporabno, neurejeno; 2 = zelo rabljeno; 3 = vidno rabljeno; 4 = očiščeno, skoraj novo, malo rabljeno; 5 = kot novo.

## Garancija
- Pod Prodajo: DA/NE in lestvica 6 / 12 / 24 mesecev (pri NE zaklenjena, shrani se 0).
- Na pregledu opreme je moder znak garancije v levem spodnjem kotu slike; brez garancije se ne prikaže.

## Statusi prodaje (barve značk in kartic)
- Ni za prodajo rdeča, Ni urejeno za prodajo rumena, Neprodano oranžna, Prodano siva, Posojeno modra.

## AI iskanje (poskusno)
- Element na domači strani, odprtokodni model v brskalniku (brezplačno, brez API ključa). Vse je v `web/src/components/ai-iskanje/`, navodila za odstranitev so v tamkajšnjem `README.md`.
- Sken serijske nalepke pri dodajanju opreme (OCR v brskalniku): `web/src/components/sken-nalepke/`, odstranitev v tamkajšnjem `README.md`.

## Verzije
- Zgodovina sprememb je v `web/src/lib/verzije.ts` (gumb "i").
