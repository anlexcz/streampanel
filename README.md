# Metrobus Stream Panel Lite

První prototyp lokální režie YouTube chatu a OBS overlayů.

## Spuštění

1. Nainstalujte [Node.js LTS](https://nodejs.org/).
2. Stáhněte ZIP z GitHub Actions (Windows package), rozbalte a spusťte **Spustit-Stream-Panel.bat**.
3. Otevřete http://localhost:4173 a vložte URL veřejného YouTube livestreamu.
4. Do OBS jako Browser Source přidejte http://localhost:4173/highlight.html (například 900×300 px). K dispozici jsou i chat.html a ticker.html.
5. V režijním panelu klikněte u zprávy na **Zvýraznit**, tlačítkem **Skrýt** ji odeberete.

**Důležité:** Knihovna youtube-chat 2.2.0 je neoficiální a starší. Připojení k aktuálnímu YouTube není ověřeno živým testem. Prvním krokem před vysíláním je otestovat funkčnost. Panel poslouchá jen na localhostu, nikoli na síti. CSV export obsahuje posledních 200 zpráv, úplnější průběžný záznam je v data/chat.jsonl. Aplikace nemá přihlášení. Vyžaduje instalaci Node.js; samostatné EXE zatím není.
