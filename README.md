# Metrobus Stream Panel Lite

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
