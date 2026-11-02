# NEXUS · Adventurer Panel for Minecraft Bedrock

**NEXUS** is a Minecraft Bedrock add-on that adds a full menu with a graphical interface, its own economy, and tools for players and administrators. It opens when you right-click on the compass or the clock and works in **Spanish and English**: each player chooses their language and sees the menu in their own language, even if another player in the same game is using the other language.

![Menú principal](docs/menu.png)

## Features

### Economy
- Own coins (“Coins”), stored on a scoreboard.
- You earn them by killing monsters (2 to 5 per monster), winning PvP battles (25), completing quests, and through the daily reward.
- Animals don't drop coins, to prevent farming.

### Store
- 4 categories (food, tools and weapons, resources, special items) and 18 items.
- Buy and sell with a quantity selector and the option to sell everything you have.
- Each transaction requires confirmation.
- It does not sell custom-named items, such as the NEXUS compass.

### Teleportation
- World spawn point, your bed, and the place where you died.
- Up to **5 home screens** with names and icons, which you can create and delete.
- Teleport requests to other players: the other player accepts or declines, with a cooldown period between requests.
- Each trip costs a small number of coins (configurable).

### Profile and Missions
- Statistics: time played, monsters defeated, PvP battles won, deaths, purchases, and coins spent.
- 5 missions with a progress bar and coin rewards.

### Rewards and Kits
- Daily reward with a **7-day streak**. On the 7th day, you'll receive diamonds and extra experience points.
- 3 kits (Adventurer, Miner, Warrior) with a cooldown. The Warrior kit costs coins.

### Temporary Improvements
- 8 effects: speed, jumping, night vision, strength, regeneration, haste, fire resistance, and underwater breathing.
- Duration: 1 to 10 minutes; power level: I, II, or III. The price is calculated before confirmation.

### Players
- List of players currently online.
- Send coins, send private messages, and request teleportation.

### Personal Settings
- HUD on the action bar with 3 styles, optional coordinates, and refresh rate.
- 6 accent colors and a custom nickname above the head.
- Menu sounds and the option to accept or decline teleportation requests.
- Instant language switch.

### Administration Panel
Available to operators or players with the tag `nexus_admin`.
- Global announcements via chat, on-screen title, or action bar.
- World Control: time, weather, keeping inventory upon death, and clearing items from the ground.
- Economy: Give, take away, or assign coins to a player.
- Quickly switch game modes.

## How to Use It

| Action | Result |
|---|---|
| Right-click with the compass or the clock | Open the main panel |
| Crouch + right-click | Open the teleporters directly |
| `/scriptevent nexus:menu` | Open the menu (useful with command blocks or NPCs) |

New players receive a **NEXUS compass** and **100 coins** when they log in. The first time you log in, a language selector appears; you can change the language later under **Settings → Language**.

To grant administrator permissions to a player who is not an operator:

```
/tag PlayerName add nexus_admin
```
