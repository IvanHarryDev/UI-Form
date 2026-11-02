import { world, ItemStack } from "@minecraft/server";
import { CONFIG, ACCENTS } from "../config";
import { getData } from "./db";
import { t } from "./i18n";

// ============================================================

export const fmtPos = (l) => `${Math.floor(l.x)}, ${Math.floor(l.y)}, ${Math.floor(l.z)}`;

export function fmtDuration(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

export function bar(current, goal, length = 24) {
    const fill = Math.round(Math.min(1, current / goal) * length);
    return `§a${"|".repeat(fill)}§8${"|".repeat(length - fill)}§r`;
}

export const clean = (text) => String(text ?? "").replace(/§./g, "").trim();

const COLORS = { ok: "§a", err: "§c", info: "§e", plain: "§f" };

export function notify(player, type, text) {
    try {
        player.sendMessage(`${CONFIG.prefix}${COLORS[type] ?? "§f"}${text}`);
    } catch { }
}

export function sfx(player, id, pitch = 1, volume = 1) {
    try {
        if (!getData(player).settings.sounds) return;
        player.playSound(id, { pitch, volume });
    } catch { }
}

export function bigTitle(player, title, subtitle = "") {
    try {
        player.onScreenDisplay.setTitle(title, {
            subtitle,
            fadeInDuration: 5,
            stayDuration: 40,
            fadeOutDuration: 12,
        });
    } catch { }
}

export const accent = (player) => ACCENTS[getData(player).settings.accent]?.[1] ?? "§b";

export function isAdmin(player) {
    try {
        return player.hasTag(CONFIG.adminTag) || (typeof player.isOp === "function" && player.isOp());
    } catch {
        return false;
    }
}

export const otherPlayers = (player) => world.getAllPlayers().filter((p) => p.id !== player.id);

export function healthOf(player) {
    try {
        const h = player.getComponent("minecraft:health");
        return { cur: Math.ceil(h.currentValue), max: Math.ceil(h.effectiveMax) };
    } catch {
        return { cur: 0, max: 20 };
    }
}

const container = (player) => player.getComponent("minecraft:inventory").container;

const isPlain = (item) => !item.nameTag && item.getLore().length === 0;

export function countItem(player, typeId) {
    const c = container(player);
    let total = 0;
    for (let i = 0; i < c.size; i++) {
        const it = c.getItem(i);
        if (it && it.typeId === typeId && isPlain(it)) total += it.amount;
    }
    return total;
}

export function removeItem(player, typeId, amount) {
    const c = container(player);
    let left = amount;
    for (let i = 0; i < c.size && left > 0; i++) {
        const it = c.getItem(i);
        if (!it || it.typeId !== typeId || !isPlain(it)) continue;
        if (it.amount <= left) {
            left -= it.amount;
            c.setItem(i, undefined);
        } else {
            it.amount -= left;
            c.setItem(i, it);
            left = 0;
        }
    }
    return left === 0;
}

export function giveItem(player, typeId, amount) {
    try {
        const c = container(player);
        let left = amount;
        while (left > 0) {
            const size = Math.min(left, new ItemStack(typeId, 1).maxAmount);
            const overflow = c.addItem(new ItemStack(typeId, size));
            if (overflow) player.dimension.spawnItem(overflow, player.location);
            left -= size;
        }
        return true;
    } catch (e) {
        console.warn(`[NEXUS] Could not give ${typeId}: ${e}`);
        return false;
    }
}

export function makeHubItem(player) {
    const item = new ItemStack("minecraft:compass", 1);
    item.nameTag = t(player, "item.hubName");
    item.setLore([t(player, "item.hubLore1"), t(player, "item.hubLore2")]);
    return item;
}

export function teleport(player, location, dimensionId, label) {
    const from = player.dimension;
    const to = world.getDimension(dimensionId ?? from.id);
    const up = (l) => ({ x: l.x, y: l.y + 1, z: l.z });
    try {
        from.spawnParticle("minecraft:totem_particle", up(player.location));
    } catch { }
    player.teleport(location, { dimension: to });
    try {
        to.spawnParticle("minecraft:totem_particle", up(location));
    } catch { }
    sfx(player, "mob.endermen.portal");
    bigTitle(player, CONFIG.brand, `§7${label ?? ""}`);
}