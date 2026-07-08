# JYSK prodejní asistent

Statická mobilní aplikace pro prodejní rozhovor u polštářů, přikrývek, setů a doplňkového prodeje povlečení. Nemá backend, databázi ani build krok. Stačí nahrát soubory na GitHub Pages.

## Jak spustit

Otevři `index.html` v prohlížeči, nebo publikuj repozitář přes GitHub Pages.

## Kde jsou data

Produktový katalog je v `data/catalog.js`.

- `data/catalog.js` obsahuje veřejně dostupné produkty z JYSK.cz: polštáře, přikrývky, sety a povlečení.
- `salesRules` obsahuje pravidla pro doplňkový prodej, 3/3 sestavu a code7 tip.

Katalog byl vytvořen z veřejných stránek JYSK.cz dne 2026-07-08:

- https://jysk.cz/loznice/polstare
- https://jysk.cz/loznice/prikryvky
- https://jysk.cz/loznice/povleceni

Nejde o oficiální JYSK API ani živé skladové napojení. Ceny, akce, dostupnost a sortiment se mohou změnit. Před reálným použitím v prodejně ověř data proti interně schválenému zdroji.

## Export z veřejných stránek

Na JYSK.cz jsem našel interní nastavení pro `products/json/main_cz/`, ale přímý přístup je blokovaný. Praktická veřejná cesta je:

1. Vykreslit kategorii v prohlížeči/headless Chrome.
2. Z DOMu vytáhnout odkazy na produkty.
3. Stáhnout veřejné produktové stránky.
4. Z `data-jysk-react-properties` vytáhnout `PDPSumUpContainer` a `ProductDetailsLayout`.
5. Vygenerovat `data/catalog.js`.

Tento přístup používá pouze veřejné stránky, proto je vhodný pro prototyp. Pro produkční interní nástroj je lepší požádat JYSK o schválený interní export nebo API.

## GitHub Pages

V repozitáři zapni `Settings -> Pages -> Deploy from a branch` a vyber větev `main`, složku `/root`.
