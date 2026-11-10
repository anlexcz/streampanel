# Metrobus Stream Panel Lite

Lokální režie YouTube chatu a **jediný přepínaný OBS overlay**.

## Spuštění

1. Nainstalujte [Node.js LTS](https://nodejs.org/).
2. Stáhněte ZIP z GitHub Actions (Windows package), rozbalte a spusťte **Spustit-Stream-Panel.bat**.
3. Otevřete http://localhost:4173 a vložte URL veřejného YouTube livestreamu.
4. V OBS přidejte **jediný** Browser Source: `http://localhost:4173/overlay.html` (například 900 × 600 px). Pozadí je průhledné.
5. V režii klikněte u zprávy na **Zvýraznit**, tlačítkem **Skrýt** se vrátíte k automatickému chatu.

## Priorita jednoho výstupu

1. Ručně zvýrazněný komentář (zůstává, dokud se neskryje).
2. Naplánovaná nebo ručně spuštěná informační zpráva.
3. Posledních pět komentářů chatu.

Zprávy se v jedné vrstvě nepřekrývají. Informační banner může během dlouhého ručního zvýraznění uplynout bez zobrazení; odložená fronta bannerů zatím není implementována. Původní samostatné overlay URL pro kompatibilitu zůstávají, ale pro běžný provoz se nepoužívají.

**Důležité:** Knihovna youtube-chat 2.2.0 je neoficiální a starší. Připojení k aktuálnímu YouTube není ověřeno živým testem. Prvním krokem před vysíláním je otestovat funkčnost. Panel poslouchá jen na localhostu, nikoli na síti. CSV export obsahuje posledních 200 zpráv, úplnější průběžný záznam je v data/chat.jsonl. Aplikace nemá přihlášení. Vyžaduje instalaci Node.js; samostatné EXE zatím není.
