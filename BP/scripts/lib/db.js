import { world } from "@minecraft/server";
import { CONFIG } from "../config";

// ============================================================

const KEY = "nexus:data";
const cache = new Map();

const defaults = () => ({
    welcomed: false,
    homes: {},
    lastDeath: null,
    claimed: [],
    cooldowns: {},
    daily: { last: 0, streak: 0 },
    stats: { mobKills: 0, pvpKills: 0, deaths: 0, minutes: 0, purchases: 0, spent: 0 },
    settings: {
        hud: true,
        hudStyle: 0,
        hudCoords: true,
        hudInterval: 10,
        accent: 0,
        nick: "",
        sounds: true,
        acceptTp: true,
        lang: "",
    },
});

export function getData(player) {
    let data = cache.get(player.id);
    if (data) return data;

    const base = defaults();
    let saved = {};
    try {
        const raw = player.getDynamicProperty(KEY);
        if (typeof raw === "string") saved = JSON.parse(raw);
    } catch (e) {
        console.warn(`[NEXUS] Corrupted data for ${player.name}, resetting: ${e}`);
    }

    data = {
        ...base,
        ...saved,
        stats: { ...base.stats, ...saved.stats },
        settings: { ...base.settings, ...saved.settings },
        daily: { ...base.daily, ...saved.daily },
    };
    cache.set(player.id, data);
    return data;
}

export function saveData(player) {
    try {
        player.setDynamicProperty(KEY, JSON.stringify(getData(player)));
    } catch (e) {
        console.warn(`[NEXUS] Could not save data for ${player.name}: ${e}`);
    }
}

export function dropCache(playerId) {
    cache.delete(playerId);
}

export function remaining(player, key) {
    return Math.max(0, (getData(player).cooldowns[key] ?? 0) - Date.now());
}

export function startCooldown(player, key, ms) {
    getData(player).cooldowns[key] = Date.now() + ms;
    saveData(player);
}

function objective() {
    const sb = world.scoreboard;
    return sb.getObjective(CONFIG.currencyObjective) ?? sb.addObjective(CONFIG.currencyObjective, CONFIG.currencyName);
}

export function getCoins(player) {
    try {
        return objective().getScore(player) ?? 0;
    } catch {
        return 0;
    }
}

export function setCoins(player, value) {
    objective().setScore(player, Math.max(0, Math.floor(value)));
}

export function addCoins(player, amount) {
    setCoins(player, getCoins(player) + amount);
}

export function spendCoins(player, amount) {
    if (getCoins(player) < amount) return false;
    setCoins(player, getCoins(player) - amount);
    getData(player).stats.spent += amount;
    saveData(player);
    return true;
}