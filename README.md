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

## Automatický zátěžový test v Design Labu

Sekce **Automatický příval** vytváří simulované komentáře ve smyčce. Lze nastavit interval **100–2000 ms** a dávku **1, 3, 5 nebo 10 zpráv**. Tlačítka **Spustit smyčku/Zastavit** generátor ovládají. Smyčka běží pouze v náhledu GitHub Pages, nikoliv v lokálním programu ani v reálném YouTube chatu. Paměť simulace je omezena na posledních 200 zpráv.

## Tempo zobrazování chatu

Příjem zprávy nyní pouze vloží komentář do **čekací fronty**. Samotný overlay se **neaktualizuje při každém příjmu**: jednou za **1,8 sekundy** odebere z fronty nejvýše jednu zprávu a přidá ji dole. Dřívější karty zůstávají, dokud nejsou vytlačeny, nezestárnou (60 sekund) nebo nevejdou do maximální výšky. Fronta uchová nejvýše **40 čekajících zpráv**; při přetížení zahazuje nejstarší dosud nezobrazené. Zprávy, které během čekání překročí 60 sekund stáří, se také přeskočí. Při prvním otevření overlaye se z historie přednačte maximálně posledních pět zpráv, aby se neopakovala dlouhá historie. Zobrazení vybraného komentáře a informačního banneru tím není omezeno.

## Zvýrazněný komentář a animace (nové)

Zvýrazněná karta nyní obsahuje pouze avatar, jméno a text, bez pruhu „Vybraný komentář“. Po výběru ji server automaticky skryje po **90 sekundách**. Ruční skrytí je okamžité z pohledu stavu; vizuální fade-out s posunem nahoru trvá 260 ms. Výběr jiného komentáře resetuje 90s limit. Stejné schéma posunu a fade-in/fade-out platí pro informační banner a běžné chatové zprávy; staré karty se při posunu ostatních nepřekreslují. V Design Labu lze časový limit otestovat bez streamu.

## Události v Design Labu

Design Lab umí simulovat **Super Chat** a **nové členství** s autorem, částkou (jen Super Chat), textem, podporou tmavého/světlého motivu a samostatnou horní vrstvou. Událost se schová po **12 sekundách** nebo ručně. **Jde zatím jen o náhled: skutečný YouTube konektor nepředává výši příspěvku a události neposílá do vrstvy.** Reálné propojení je další vývojový krok.

Čekací fronta běžného chatu je zvětšená na **80 zpráv**. Tempo: do 5 čekajících jedna za 1,8 s; od 6 jedna za 1,2 s; od 16 jedna za 0,8 s. Stáří zpráv zůstává 60 s a fronta přes limit zahazuje nejstarší čekající zprávy.

## Návrh událostí v Design Labu (30 s)

Super Chat a členství jsou v jednom kompaktním grafickém boxu: avatar, jméno, zpráva, zvýrazněná částka nebo označení „NOVÝ ČLEN“. Zlatý/tyrkysový akcent je **na spodní hraně**. Událost nahoře uprostřed přijíždí **shora o 25 px (350 ms)** a odjíždí **nahoru o 25 px (350 ms)**. Vybraný komentář vlevo dole přijíždí **zdola o 25 px (350 ms)** a stejným směrem zase odjíždí. Horizontální vystředění události zůstává trvale na nadřazené vrstvě; animuje se pouze karta.

Design Lab má simulovanou frontu událostí: každá má **30 s od začátku zobrazení**, po výstupní animaci následuje **500ms pauza**, pak další. Skrytí události přejde na další po téže pauze. Jde o designový simulátor, ne zapojenou YouTube událostní frontu na serveru.

## Režisérský panel – provozní rozložení

V online prototypu `director.html` byly odstraněny testovací tlačítka pro generování chatu, manuální zadávání Super Chatů, filtr „Jen otázky“ i tlačítko pro ukázkový zvýrazněný komentář. Samostatný `preview.html` nadále slouží pro grafické a zátěžové testy. Režisérský prototyp stále využívá ukázková lokální data a falešný stav připojení; automatické získávání Super Chatů a členství z YouTube není dosud implementováno do reálného lokálního serveru.
