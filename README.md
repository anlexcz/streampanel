# Metrobus Stream Panel Lite – Windows balíček

## Stažení a spuštění

1. Otevřete [GitHub Actions – Windows package](https://github.com/anlexcz/streampanel/actions/workflows/package.yml) a poslední úspěšný běh.
2. V jeho sekci **Artifacts** stáhněte `MetrobusStreamPanel-win-x64`. Rozbalte ZIP.
3. Nainstalujte [Node.js LTS](https://nodejs.org/), pokud není na počítači.
4. Spusťte `Spustit-Stream-Panel.bat`. Otevře se `http://localhost:4173` s **novou režisérskou obrazovkou**.
5. V OBS přidejte **jediný Browser Source**, URL `http://localhost:4173/overlay.html`, rozlišení **1920 × 1080**.

Režie má chat vlevo (40 %), vpravo připojení YouTube, odkaz na OBS, rozbalovací náhled, pořadník Super Chatů/členství a zvýrazněný komentář. Zvýraznění: 90 sekund, přepnutí tlačítkem **Zvýraznit / V obraze**, ruční skrytí. Seznam chatu se při najetí myší nepřerovnává. Super Chat a rozpoznaná nová členství: 30 sekund na událost, fronta s 500ms mezerou po výstupní animaci, ruční přeskočení.

## Stav podpory YouTube

Knihovna `youtube-chat@2.2.0` je **neoficiální**. Podporuje pole `superchat.amount` a `author.thumbnail.url`, která nyní předáváme do overlaye. Rozpoznávání **nového členství** závisí na tom, zda knihovna událost skutečně označí jako členství; samotné běžné komentáře existujících členů se nesmějí mylně zobrazovat jako nová členství. Funkčnost reálného chatu, placených zpráv i členství je **nutné otestovat na skutečném živém streamu**; sestavení ZIPu samo o sobě příjem z YouTube neověřuje. V současnosti nelze garantovat kompletní podporu všech nových formátů YouTube.

## Data a nastavení

Příchozí komentáře se ukládají do `data/chat.jsonl`, posledních 200 zpráv lze stáhnout jako CSV přes `http://localhost:4173/export`. Barva motivu a viditelnost chatu se ukládají do `data/config.json`. Server běží pouze na `127.0.0.1:4173` a není určen k veřejnému vystavení.

## Design Lab

- [Režisérský prototyp](https://anlexcz.github.io/streampanel/director.html)
- [Testování grafiky a simulace](https://anlexcz.github.io/streampanel/preview.html)

Tyto statické stránky jsou samostatné ukázky, zatímco lokální `/director.html` je připojený na skutečný Node.js server.

## Lokální provoz

Režie i OBS overlay běží na jediném PC: `http://localhost:4173` a `http://localhost:4173/overlay.html`. Server naslouchá pouze na `127.0.0.1`. LAN port 4174 není aktivní.

## Vzhled a avatary

Tmavé karty mají krytí 97 %, světlé 98 %. Ze zobrazovaných jmen se odstraní úvodní `@`. U profilových fotek se přebírá `author.thumbnail.url` z youtube-chat; není-li fotka dostupná nebo se nenačte, zobrazí se iniciály. Načtení obrázků je nutné ověřit na živém chatu.
