# 🦢 HONK ROGUE 3D: The Goose Retribution

This game was created as part of the **"Against the Clock"** challenge, starting with a 1-hour sprint and followed by a 4-hour polish and feature expansion (Total: 5 hours of AI-assisted development).

The goal was to build a functional game within the **Honk Metaverse** (IYKYK) in record time. This includes everything from development to testing. Once the time is up, the Gemini CLI (or your favorite AI-powered IDE) is closed. Feel free to join the challenge if you want! XD

---

### 🕹️ [PLAY 5H EDITION!](https://honkv2.94.140.224.220.sslip.io/)
*(Original 1h version is still at [honk.94.140.224.220.sslip.io](https://honk.94.140.224.220.sslip.io/))*
*Note: Limited testing on iOS and Safari. It is highly recommended to use a modern browser (like Chrome) rather than a mobile webview.*

---

## ✦ Evolution (The +4h Expansion)

After the initial 1-hour prototype, we spent an additional 4 hours on:
*   **Visual Overhaul:** Detailed procedural models for all enemies (cats with whiskers, slimes with cores, armored bulls).
*   **Audio System:** Procedural Web Audio API sound effects (Honks, Hits, Dashes).
*   **Mechanics:** Proper auto-aiming, dash direction correction, and Slime-splitting logic.
*   **Arena:** Expanded "Infinite-style" island floating in space with starfields.
*   **Tactical Zoom:** Added a zoom switcher (🔍) with 3 levels: Close, Medium, and Tactical (whole field) for better battle control.
*   **Stability:** Deep bugfixing of hitboxes, scaling, and state management.

## ✦ About the Game

**HONK ROGUE 3D** is a third-person browser Roguelike action game powered by **Three.js (WebGL)**. It is contained within a single `index.html` file—no heavy assets involved, everything is procedurally generated or built with code.

### 🕹️ Gameplay
You play as a **Battle Goose** seeking vengeance against humanity.
*   **Controls:** WASD / Swipe (Move), Space (Attack), Shift (Dash).
*   **Objective:** Survive through 5 Arena Stages.
*   **Enemies:** Flies, Rats, Cats, the Anti-Goose (your evil clone), and the Final Boss.

### ⚔️ Unique Features
1.  **Build System:** A Golden Egg drops after every wave. Pick it up to choose 1 of 3 upgrade cards.
    *   **Weapons:** Knife (Bleed effect), Bat (AOE swing), Shuriken (Ranged attack).
    *   **Skills:** Dash Stun, Lifesteal, Speed Boosts.
2.  **Visuals:**
    *   Dynamic visual progression: the Goose holds a knife in its beak, carries a bat on its back, or wears a shuriken halo.
    *   Shader-based grass, dynamic lighting, and real-time shadows.
    *   Unique enemy models and animations (flapping wings, wagging tails).
3.  **Cross-platform:** Full support for mobile devices with a virtual joystick, large buttons, and adaptive UI. (A bold claim! 🤡🌚🤖)

### 🏆 The Finale
The game is short but intense (approx. 5-10 minutes). Defeat the Human Boss to see the legendary victory message: **"WINNER WINNER CHICKEN DINNER"**.

### 🛠️ Technical Specs
*   **Tech Stack:** Pure Vanilla JS (no React/Vue/Angular) with ES6 Modules.
*   **Deployment:** Wrapped in Docker and deployed with SSL.
*   **Footprint:** ~200 KB total.

---

## 🛠️ Local Development

Due to the use of ES6 Modules, you **cannot** open `index.html` directly from your file system (`file://` protocol) as it will trigger CORS errors. You must use a local web server.

### 🚀 Quick Start (Python)
If you have Python installed, use the provided dev server:
```bash
python scripts/dev_server.py
```
Then open [http://localhost:8080](http://localhost:8080) in your browser.

### 📦 Other Servers
Alternatively, you can use any static file server:
*   **Node.js:** `npx serve .`
*   **PHP:** `php -S localhost:8080`


---

## ⏱️ Timeline: The 1-Hour Sprint

How it was built as a reference for AI-driven development:

*   **0-10m:** Concept brainstorming (Grok).
*   **10-18m:** Project Initialization (Setting up MD-based file structure for AI context).
*   **18-20m:** Task Decomposition.
*   **20-28m:** Core Engine: Graphics initialization & Free movement.
*   **28-31m:** Combat System (One-shot mechanics).
*   **31-33m:** Level Transitions (Room logic).
*   **33-38m:** Enemy Variety & Scaling: Flies → Rats → Cats → Anti-Goose → BOSS. Added health bars and dynamic difficulty.
*   **38-43m:** Playtesting, Bugfixes, and Main Menu.
*   **43-46m:** Loot System: Golden Eggs & Upgrades.
*   **46-50m:** Visual Polish: Animation systems (Friction/Velocity) and procedural models.
*   **50-53m:** Environmental details: Grass and final fixes.
*   **53-55m:** Advanced Animation refinement.
*   **55-57m:** Final stability fixes.
*   **1h 00m:** Final prompt execution (Bugfixes & Deployment prep).

---

### 🇷🇺 Описание на русском

Игра была создана в рамках челленджа **"Against the Clock"**: сначала 1-часовой спринт, а затем 4-часовая полировка и расширение фич (всего 5 часов разработки с ИИ).

Цель — создать игру в Honk метавселенной за рекордное время. Этот проект — демонстрация того, как быстро можно пройти путь от идеи до готового продукта с помощью Gemini.

**🕹️ [ИГРАТЬ (5H EDITION)!](https://honkv2.94.140.224.220.sslip.io/)**

**Что изменилось за дополнительные 4 часа:**
*   **Полный редизайн врагов:** Коты с усами, сегментированные мухи, люди-фермеры, слаймы с ядром.
*   **Звуковая система:** Процедурная генерация звуков (Хонки, удары, рывки) через Web Audio API.
*   **Геймплей:** Улучшенный автоприцел, рывок в сторону движения, деление слаймов.
*   **Атмосфера:** Арена теперь "летает" в космосе со звездным небом.
*   **Тактический обзор:** Добавлен переключатель зума (🔍) с 3 уровнями (Близко, Средне, Поле боя) для лучшего контроля ситуации.
*   **Стабильность:** Исправление хитбоксов и логики урона.

**🕹 Геймплей**
Ты играешь за Боевого Гуся, который мстит человечеству.
*   **Управление:** WASD / Свайпы (бег), Пробел (Атака), Shift (Рывок).
*   **Цель:** Пройти 5 арен (Комнат).
*   **Враги:** Мухи, Крысы, Коты, Анти-Гусь (злой клон) и Финальный Босс.

**⚔️ Уникальные фишки**
1.  **Система билдов:** После каждой волны выпадает Золотое Яйцо. Подбираешь его → выбираешь 1 из 3 карт апгрейдов.
2.  **Визуал:** Гусь меняет внешний вид в зависимости от оружия. Шейдерная трава, динамическое освещение.
3.  **Кроссплатформа:** Поддержка мобилок (джойстик, адаптивный UI).

**🏆 Финал**
Игра короткая (5-10 минут). Если победишь Босса-Человека, увидишь легендарную надпись: **"WINNER WINNER CHICKEN DINNER"**.

**Технически:** Чистый Vanilla JS без фреймворков, завернутый в Docker и задеплоенный с SSL. Весит ~200 КБ.