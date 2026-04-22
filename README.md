# Happy Birthday Autostart Program

Een Windows .exe programma dat "Happy Birthday" toont met ballonnen animatie en geluid, perfect voor verjaardagsvieringen!

## Functies

- **Ballonnen Animatie**: Kleurrijke ballonnen die opstijgen
- **YouTube Muziek**: Speel automatisch een YouTube video af voor muziek
- **Fullscreen Modus**: Automatische fullscreen weergave (druk ESC om te verlaten)
- **Datum & Tijd Instelling**: Start alleen op een ingestelde datum en tijd via `config.txt`
- **Autostart**: Kan worden toegevoegd aan Windows autostart
- **Automatisch Sluiten**: Sluit na 30 seconden

## Bestanden

- `HappyBirthday.exe` - Hoofdprogramma
- `config.txt` - Configuratiebestand voor starttijd
- `README.md` - Deze instructies

## Configuratie

Open `config.txt` en pas de datum, tijd en muziek aan:

```
date=23-04
time=09:00
youtube=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Datum Formaat**: DD-MM (bijvoorbeeld: 23-04 voor 23 april)
**Tijd Formaat**: HH:MM (24-uurs formaat, bijvoorbeeld: 09:00)
**YouTube Formaat**: Volledige YouTube URL of video ID

**Muziek Opties**:
- Voeg een YouTube link toe om automatisch muziek af te spelen
- Verwijder de `youtube=` regel om het standaard Happy Birthday liedje te gebruiken
- Ondersteunde formaten: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`

**Start Opties**:
- Beide datum en tijd moeten overeenkomen om te starten
- Verwijder de `date=` regel om elke dag te starten op de ingestelde tijd
- Verwijder de `time=` regel om elke keer te starten op de ingestelde datum
- Verwijder beide regels om het programma altijd te starten

## Autostart Installatie

### Methode 1: Handmatig via Taakplanner

1. **Open Taakplanner**
   - Druk op `Win + R`, typ `taskschd.msc` en druk op Enter

2. **Maak Nieuwe Taak**
   - Klik op "Taak maken..." in het rechter paneel
   - Geef een naam: "Happy Birthday Verjaardag"

3. **Stel Trigger In**
   - Ga naar tab "Triggers"
   - Klik "Nieuw..."
   - Kies "Bij aanmelden"
   - Vink "Ingeschakeld" aan en klik "OK"

4. **Stel Actie In**
   - Ga naar tab "Acties"
   - Klik "Nieuw..."
   - Actie: "Programma starten"
   - Programma/Script: Blader naar `HappyBirthday.exe`
   - Klik "OK"

5. **Instellingen**
   - Ga naar tab "Instellingen"
   - Vink "Taak stoppen als deze langer dan:" uit
   - Vink "Taak opnieuw starten" aan

6. **Sla op**
   - Klik "OK" om de taak op te slaan

### Methode 2: Via Opstartmap

1. **Open Opstartmap**
   - Druk op `Win + R`, typ `shell:startup` en druk op Enter

2. **Kopieer Bestanden**
   - Kopieer `HappyBirthday.exe` en `config.txt` naar de opstartmap

### Methode 3: Via Registry (Advanced)

1. **Open Registry Editor**
   - Druk op `Win + R`, typ `regedit` en druk op Enter

2. **Navigeer naar Autostart Key**
   - Ga naar: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`

3. **Voeg Nieuwe Waarde Toe**
   - Rechterklik -> Nieuw -> Tekenreekswaarde
   - Naam: `HappyBirthday`
   - Waarde: Volledig pad naar `HappyBirthday.exe`

## Gebruik

1. **Testen**: Dubbelklik op `HappyBirthday.exe` om te testen
2. **Tijd Instellen**: Pas `config.txt` aan voor de gewenste starttijd
3. **Autostart**: Volg een van de installatiemethodes hierboven
4. **Klaar**: Het programma start automatisch op de ingestelde tijd

## Probleemoplossing

- **Programma start niet**: Controleer of `config.txt` dezelfde map heeft als `HappyBirthday.exe`
- **Geluid werkt niet**: Zorg dat de computer niet op mute staat
- **Tijd klopt niet**: Controleer de tijdnotatie in `config.txt` (HH:MM formaat)

## Verwijderen

Om het programma uit autostart te verwijderen:
- Verwijder de taak uit Taakplanner
- Of verwijder de bestanden uit de opstartmap
- Of verwijder de registry-waarde

## Systeem Vereisten

- Windows 10/11
- Geen extra software nodig (alles ingebouwd in .exe)

---

**Veel plezier met de verjaardagsviering!**
