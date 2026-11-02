// ============================================================

export const CONFIG = {
    brand: "§l§bNEXUS§r",
    prefix: "§8[§bNEXUS§8]§r ",
    defaultLang: "en",
    currencyObjective: "coins",
    currencyName: "Coins",
    startCoins: 100,
    menuItems: ["minecraft:compass", "minecraft:clock"],
    adminTag: "nexus_admin",
    maxHomes: 5,
    teleportCost: 5,
    tpaCooldownMs: 30000,
};

export const ACCENTS = [
    ["aqua", "§b"],
    ["green", "§a"],
    ["gold", "§6"],
    ["red", "§c"],
    ["purple", "§d"],
    ["white", "§f"],
];

export const HUD_STYLES = ["full", "compact", "minimal"];

export const HOME_ICONS = [
    { key: "house", tex: "textures/items/bed_red" },
    { key: "mine", tex: "textures/items/iron_pickaxe" },
    { key: "farm", tex: "textures/items/wheat" },
    { key: "portal", tex: "textures/items/ender_pearl" },
    { key: "treasure", tex: "textures/items/emerald" },
];

export const DAILY = {
    cooldownMs: 24 * 60 * 60 * 1000,
    base: 50,
    step: 25,
};

export const SHOP = [
    {
        key: "food",
        icon: "textures/items/bread",
        items: [
            { id: "minecraft:bread", icon: "textures/items/bread", buy: 6, sell: 2, max: 32 },
            { id: "minecraft:cooked_beef", icon: "textures/items/beef_cooked", buy: 12, sell: 4, max: 32 },
            { id: "minecraft:golden_apple", icon: "textures/items/apple_golden", buy: 120, sell: 40, max: 8 },
        ],
    },
    {
        key: "tools",
        icon: "textures/items/diamond_pickaxe",
        items: [
            { id: "minecraft:iron_pickaxe", icon: "textures/items/iron_pickaxe", buy: 90, sell: 30, max: 4 },
            { id: "minecraft:diamond_pickaxe", icon: "textures/items/diamond_pickaxe", buy: 400, sell: 130, max: 4 },
            { id: "minecraft:diamond_sword", icon: "textures/items/diamond_sword", buy: 350, sell: 110, max: 4 },
            { id: "minecraft:bow", icon: "textures/items/bow_standby", buy: 80, sell: 25, max: 4 },
            { id: "minecraft:arrow", icon: "textures/items/arrow", buy: 2, sell: 1, max: 64 },
        ],
    },
    {
        key: "resources",
        icon: "textures/items/iron_ingot",
        items: [
            { id: "minecraft:coal", icon: "textures/items/coal", buy: 4, sell: 1, max: 64 },
            { id: "minecraft:iron_ingot", icon: "textures/items/iron_ingot", buy: 18, sell: 6, max: 64 },
            { id: "minecraft:gold_ingot", icon: "textures/items/gold_ingot", buy: 30, sell: 10, max: 64 },
            { id: "minecraft:diamond", icon: "textures/items/diamond", buy: 150, sell: 50, max: 32 },
            { id: "minecraft:emerald", icon: "textures/items/emerald", buy: 60, sell: 20, max: 32 },
        ],
    },
    {
        key: "special",
        icon: "textures/items/nether_star",
        items: [
            { id: "minecraft:ender_pearl", icon: "textures/items/ender_pearl", buy: 40, sell: 12, max: 16 },
            { id: "minecraft:experience_bottle", icon: "textures/items/experience_bottle", buy: 25, sell: 8, max: 32 },
            { id: "minecraft:totem_of_undying", icon: "textures/items/totem", buy: 600, sell: 200, max: 2 },
            { id: "minecraft:mace", icon: "textures/items/mace", buy: 1500, sell: 500, max: 1 },
            { id: "minecraft:trident", icon: "textures/items/trident", buy: 900, sell: 300, max: 1 },
        ],
    },
];

export const KITS = [
    {
        id: "adventurer",
        icon: "textures/items/stone_sword",
        cooldownMs: 30 * 60 * 1000,
        cost: 0,
        items: [["minecraft:stone_sword", 1], ["minecraft:bread", 8], ["minecraft:torch", 16]],
    },
    {
        id: "miner",
        icon: "textures/items/iron_pickaxe",
        cooldownMs: 60 * 60 * 1000,
        cost: 0,
        items: [["minecraft:iron_pickaxe", 1], ["minecraft:torch", 32], ["minecraft:cooked_beef", 8]],
    },
    {
        id: "warrior",
        icon: "textures/items/iron_sword",
        cooldownMs: 2 * 60 * 60 * 1000,
        cost: 50,
        items: [["minecraft:iron_sword", 1], ["minecraft:shield", 1], ["minecraft:golden_apple", 2], ["minecraft:arrow", 32]],
    },
];

export const BUFFS = [
    { id: "speed", price: 5 },
    { id: "jump_boost", price: 4 },
    { id: "night_vision", price: 3 },
    { id: "strength", price: 10 },
    { id: "regeneration", price: 8 },
    { id: "haste", price: 6 },
    { id: "fire_resistance", price: 4 },
    { id: "water_breathing", price: 3 },
];


export const QUESTS = [
    { id: "hunter1", stat: "mobKills", goal: 25, reward: 150, icon: "textures/items/stone_sword" },
    { id: "hunter2", stat: "mobKills", goal: 100, reward: 600, icon: "textures/items/diamond_sword" },
    { id: "duelist", stat: "pvpKills", goal: 3, reward: 300, icon: "textures/items/iron_sword" },
    { id: "survivor", stat: "minutes", goal: 60, reward: 250, icon: "textures/items/clock_item" },
    { id: "trader", stat: "purchases", goal: 10, reward: 200, icon: "textures/items/emerald" },
];