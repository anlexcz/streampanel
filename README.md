# Metrobus Stream Panel Lite

Lokální režie YouTube chatu. **Jediný OBS zdroj se čtyřmi nezávislými vrstvami.**

## Stažení a spuštění

1. Nainstalujte [Node.js LTS](https://nodejs.org/).
2. V [GitHub Actions](https://github.com/anlexcz/streampanel/actions) otevřete poslední úspěšný běh **Windows package** a v sekci Artifacts stáhněte `MetrobusStreamPanel-win-x64`.
3. Rozbalte ZIP. Ve složce `MetrobusStreamPanel` spusťte `Spustit-Stream-Panel.bat`, konzolové okno nechte otevřené.
4. Webová režie je na `http://localhost:4173`.
5. Otestujte tlačítkem **Testovací zpráva**, kliknutím na **Zvýraznit** a volbou **Zobrazit hned** u informační zprávy.
6. Do OBS vložte **jeden zdroj Prohlížeč** s adresou `http://localhost:4173/overlay.html`, šířkou 1920 a výškou 1080. Zdroj roztáhněte přes celou scénu.
7. Vložte URL veřejného právě běžícího YouTube livestreamu s dostupným chatem a stiskněte **Připojit**.

## Vrstvy společného OBS zdroje

- Chat: vpravo dole, posledních pět běžných komentářů.
- Zvýrazněný komentář: vlevo dole; nezakrývá automatický chat jako stav aplikace.
- Informační zprávy: nahoře vlevo, lze zobrazit současně s oběma druhy komentářů.
- Významné události: prostor nahoře vpravo připravený pro budoucí funkce (zatím neaktivní).

Původní samostatné adresy `/chat.html`, `/highlight.html` a `/ticker.html` zůstávají pro kompatibilitu, ale normálně se nepoužívají.

## Známá omezení

YouTube sběrač používá starší neoficiální knihovnu `youtube-chat@2.2.0`. Živý sběr je nutné otestovat na skutečně běžícím streamu; nemusí fungovat při změnách YouTube. Na počítači musí být Node.js a panel běží jen na localhostu, bez přihlášení. CSV export obsahuje posledních 200 zpráv relace, průběžný log je `data/chat.jsonl`.
