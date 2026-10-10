# Sken serijske nalepke (poskusno)

Okno »Skeniraj nalepko« desno v razdelku Osnovni podatki pri dodajanju nove opreme (`/dodaj`).

## Kako deluje
- Fotografija nalepke se pomanjša (1600 px), nato jo prebere odprtokodni OCR [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) (PP-OCRv6 small, latinica) v brskalniku, z WebGPU, če je na voljo. Knjižnica `@paddleocr/paddleocr-js` se naloži s CDN (jsDelivr), ker je Turbopack ne zna zapakirati, zato v `package.json` ni paketa. Modela (~31 MB) sta v `public/ocr/`, ker je izvorni strežnik PaddleOCR (Kitajska) iz Evrope zelo počasen.
- OCR vrne okvirje besedila s položajem. `razcleni.ts` poišče oznake (Product type / Tip proizvoda / Model, Product code / Koda proizvoda, Serial number / Serijska številka, Production year / Leto izdelave / MFG date ...) približno, ker OCR oznake včasih popači (»PROCUCT TYPE«). Vrednost je desno od oznake ali pod njo.
- Če oznake ni mogoče prebrati, se uporabijo Finesovi formati: serijska `24.1113.024` ali `F011115330`, ident `100-601.3007`; leto iz prvih dveh števk serijske (24 -> 2024).
- Skupino opreme izbere po imenu skupine na nalepki, po skupini obstoječe opreme z isto oznako v nazivu (npr. FB) ali po imenu linije (npr. PRO-COOK -> »Pro cook ...«).
- Preizkušeno na 6 fotografijah nalepk iz `data/` (Slika2): naziv, ident, serijska in leto so bili najdeni pri vseh, kjer so na nalepki.
- Podatki se vpišejo samo v **prazna** polja (Naziv, Ident, Serijska številka, Skupina, Leto). Datum prejema, količina in EM se ne spreminjajo.
- Slika se ne shrani, nič se ne pošilja k zunanjim AI storitvam. Brez stroškov in API ključev.

## Dodajanje oznak
Če nalepke kakšnega proizvajalca uporabljajo drugačno oznako (npr. »Fabr.-Nr.«), jo dodaj v `OZNAKE` v `razcleni.ts` (male črke, brez šumnikov in ločil). Oznake, ki niso za nobeno polje (npr. »Masa«), so v `DRUGE_OZNAKE`.

## Datoteke
- `src/components/sken-nalepke/`: `SkenNalepke.tsx` (okno), `ocr.ts` (PaddleOCR), `razcleni.ts` (pravila), ta README
- `public/ocr/`: modela PaddleOCR (`PP-OCRv6_small_det.tar`, `PP-OCRv6_small_rec.tar`)
- `src/proxy.ts`: končnica `tar` v izjemah matcherja (modela se naložita brez preverjanja prijave; lahko ostane)
- `src/app/oprema/OpremaObrazec.tsx`: uvoz in `{novo && <SkenNalepke ... />}` z ovojnim `<div>` v razdelku Osnovni podatki

## Odstranitev
1. Izbriši mapi `src/components/sken-nalepke/` in `public/ocr/`.
2. V `src/app/oprema/OpremaObrazec.tsx` odstrani uvoz `SkenNalepke`, vrstico `{novo && <SkenNalepke ... />}` in ovojni `<div className={novo ? ...}>` okoli polj Osnovnih podatkov.
3. V `src/lib/verzije.ts` dodaj verzijo z opombo o odstranitvi.

Baza se ne spreminja.
