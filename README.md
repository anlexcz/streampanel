# Metrobus Stream Panel Lite

## Online náhled designu (GitHub Pages)

Pokud jsou GitHub Pages nastavené na větev `main` a kořenovou složku `/`, otevřete:

**https://anlexcz.github.io/streampanel/preview.html**

Náhled funguje bez instalace a bez přístupu k YouTube. Simuluje průběžný chat, zvýrazněnou zprávu a informační banner současně ve scéně 1920 × 1080. Používá stejný `public/style.css` a vykreslovací skript `public/overlay.js` jako OBS. Úpravy těchto souborů v GitHubu se po nasazení Pages projeví v náhledu. Reálné vysílání zůstává lokální: GitHub Pages nespouštějí Node.js ani nesbírají živý chat.


Lokální režie YouTube chatu a **jeden společný transparentní OBS overlay s nezávislými vrstvami**.

## Instalace a spuštění na Windows

1. Nainstalujte [Node.js LTS](https://nodejs.org/) (nutné i při použití ZIP z Actions).
2. V [GitHub Actions](https://github.com/anlexcz/streampanel/actions) otevřete úspěšný běh **Windows package** a stáhněte artefakt `MetrobusStreamPanel-win-x64`.
3. Rozbalte ZIP, otevřete složku `MetrobusStreamPanel` a spusťte `Spustit-Stream-Panel.bat`. Nezavírejte běžící okno programu.
4. Pokud se prohlížeč neotevře automaticky, přejděte na **http://localhost:4173**.
5. Nejdříve stiskněte **Testovací zpráva**. V [náhledu overlaye](http://localhost:4173/overlay.html) ověřte chat, pak v režii klikněte **Zvýraznit** a zkontrolujte, že běžný chat zůstává viditelný.
6. Zvolte informační zprávu a **Zobrazit hned**. Lze ji zobrazit souběžně s chatem a zvýrazněním.
7. V OBS vložte **jediný** zdroj typu Prohlížeč (Browser Source): `http://localhost:4173/overlay.html`, nastavte **1920 × 1080** a umístěte přes celou scénu. Pozadí stránky je průhledné.
8. Vložte odkaz na aktuálně vysílané veřejné YouTube video, klikněte **Připojit** a počkejte na zprávy.

## Vrstvy jedné stránky

- **Chat** – až pět běžných zpráv vpravo dole.
- **Zvýrazněný komentář** – ruční výběr vlevo dole, zůstane až do skrytí.
- **Informační banner** – nahoře vlevo; může běžet současně s oběma dalšími vrstvami.
- **Události** – rezervovaná oblast vpravo nahoře; samostatné vykreslování událostí zatím není hotové.

Vrstvy se vzájemně nevypínají. Pro OBS se používá pouze `/overlay.html`. Starší samostatné adresy `/chat.html`, `/highlight.html` a `/ticker.html` jsou zachovány pro kompatibilitu.

## Omezení prototypu

Knihovna `youtube-chat@2.2.0` je neoficiální a není potvrzené, zda na dnešním YouTube přijímá zprávy. Nejdříve otestujte na skutečně živém streamu s otevřeným chatem. Běh lokálně vyžaduje Node.js; není to samostatné EXE.

CSV export obsahuje posledních 200 zpráv aktuální relace; zprávy jsou průběžně zapisovány také do `data/chat.jsonl`. Program poslouchá jen na `127.0.0.1`. Prototyp nemá autentizaci a není určen k vystavení na veřejný internet.

## Grafické motivy

V lokální režii vyberte **Vzhled overlaye → Tmavý/Světlý** a nastavení uložte. Oba motivy jsou dostupné také v [Design Labu](https://anlexcz.github.io/streampanel/preview.html). Pozadí streamu zůstává transparentní. Motiv platí pro celý jeden OBS zdroj.

## Aktuální pravidla chatu

Automatický chat zobrazuje nejvýše **5 posledních běžných zpráv**, v pořadí od nejstarší nahoře po nejnovější dole. Příchod nové zprávy odstraní nejstarší viditelnou zprávu. Zprávy samy po čase nemizí a všechny viditelné karty se při každém novém stavu znovu vykreslí (tedy znovu animují). Server drží v RAM nejvýše **200** zpráv aktuálního streamu; jednotlivý text ořízne na **1500 znaků**. Vysoké nebo dlouhé zprávy mohou přesáhnout rezervovanou výšku obrazovky. Nastavení počtu zpráv, stárnutí, plynulé animace posunu a omezení výšky jsou otevřené úkoly pro další iteraci.

## Posouvání chatu (nové)

Každá viditelná zpráva má vlastní DOM prvek: nová se přidá dole, starší se plynule posunou nahoru bez opakování své vstupní animace. Na obrazovce zůstává nejvýše **5 zpráv**, každá maximálně **60 sekund od přijetí**. Chat zabírá nejvýše **42 % výšky obrazu**; dlouhé texty jsou omezené na čtyři řádky a pokud se pět karet nevejde, zahodí se nejstarší. Zvýrazněný komentář a informační banner nejsou časovačem průběžného chatu ovlivněny. Design Lab umožňuje simulovat příval zpráv a jejich zestárnutí.
