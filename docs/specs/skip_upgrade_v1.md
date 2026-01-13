# SPEC-006: Upgrade Skip Feature

## Core Concept
Players often encounter situations where all three upgrade options are undesirable (e.g., they all replace a preferred weapon). To solve this, a "Skip" option will be added to the Upgrade Menu.

## 1. UI Design
- **Component:** `UpgradeMenu`
- **New Element:** A "Skip" button.
- **Placement:** Below the three upgrade option cards, centered.
- **Visual Style:**
  - Background: `#c0392b` (Dark Red)
  - Text: "SKIP UPGRADE (CONTINUE TO NEXT ROOM)"
  - Hover state: Brighten color to `#e74c3c`.
- **Dimensions:** Full width of the menu container, height approx. 40px.

## 2. Logic Flow
1. **Trigger:** User clicks the Skip button.
2. **Action:** 
   - Play a subtle 'click' sound.
   - Call the `onTransitionStart()` callback provided to the `showUpgradeMenu` function.
   - Close/Hide the Upgrade Menu UI.
3. **Outcome:** The player proceeds to the next level without any change to their `upgradeLevels` or stats.

## 3. Edge Cases
- **Full Inventory:** The Skip button is especially important when the player has 3 weapons and is offered 3 different weapons to replace them. Skip allows them to keep their current loadout.
- **Level 16 (Victory):** If Level 16 is reached, the upgrade menu might still show up after Level 15. Skip should still work and lead to the victory sequence transition.

## 4. Technical Implementation Tasks
1. **UI:** Modify `src/ui/menus.js` to add the Skip button to the `showUpgradeMenu` HTML generation.
2. **Logic:** Add an event listener to the Skip button that calls `onTransitionStart()` and closes the menu.
