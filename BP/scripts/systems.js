import { world, system } from "@minecraft/server";
import { CONFIG } from "./config";
import { getData, saveData, dropCache, getCoins, addCoins } from "./lib/db";
import { fmtPos, healthOf, accent, notify, sfx, bigTitle, makeHubItem } from "./lib/utils";
import { useLang, dimName } from "./lib/i18n";
import { openHub, pickLanguage } from "./ui/forms";

// ============================================================

const hudTimers = new Map();

function buildHud(player, d) {
    const { T, N } = useLang(player);
    const hp = healthOf(player);
    const coins = N(getCoins(player));
    const pos = d.settings.hudCoords ? ` §8| §f${fmtPos(player.location)}` : "";

    switch (d.settings.hudStyle) {
        case 1: // Compact
            return T("hud.compact", { hp: hp.cur, coins, pos });
        case 2: // Minimal
            return T("hud.minimal", { coins });
        default: // Full
            return T("hud.full", {
                accent: accent(player),
                brand: CONFIG.brand,
                hp: hp.cur,
                max: hp.max,
                coins,
                pos,
                dim: dimName(player, player.dimension.id),
            });
    }
}

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const d = getData(player);
        if (!d.settings.hud) continue;

        const elapsed = (hudTimers.get(player.id) ?? 0) + 5;
        if (elapsed < d.settings.hudInterval) {
            hudTimers.set(player.id, elapsed);
            continue;
        }
        hudTimers.set(player.id, 0);
        try {
            player.onScreenDisplay.setActionBar(buildHud(player, d));
        } catch { }
    }
}, 5);

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        getData(player).stats.minutes++;
        saveData(player);
    }
}, 1200);

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    try {
        const killer = damageSource?.damagingEntity;

        if (deadEntity.typeId === "minecraft:player") {
            const d = getData(deadEntity);
            const { x, y, z } = deadEntity.location;
            d.stats.deaths++;
            d.lastDeath = { x, y, z, dim: deadEntity.dimension.id };
            saveData(deadEntity);

            if (killer?.typeId === "minecraft:player" && killer.id !== deadEntity.id) {
                getData(killer).stats.pvpKills++;
                addCoins(killer, 25);
                saveData(killer);
                notify(killer, "ok", useLang(killer).T("sys.pvpReward"));
            }
            return;
        }

        if (killer?.typeId !== "minecraft:player") return;

        const isMonster = deadEntity.getComponent("minecraft:type_family")?.hasTypeFamily("monster");
        if (!isMonster) return;

        const reward = 2 + Math.floor(Math.random() * 4); // 2-5
        getData(killer).stats.mobKills++;
        addCoins(killer, reward);
        saveData(killer);
        sfx(killer, "random.orb", 1.4, 0.5);
    } catch (e) {
        console.warn(`[NEXUS] Error in entityDie: ${e}`);
    }
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    system.runTimeout(async () => {
        if (!player.isValid) return;
        const d = getData(player);

        if (initialSpawn) {
            if (!d.settings.lang) {
                const code = await pickLanguage(player);
                if (code) {
                    d.settings.lang = code;
                    saveData(player);
                }
            }
            if (!player.isValid) return;

            const { T } = useLang(player);
            if (d.settings.nick) player.nameTag = d.settings.nick;

            if (!d.welcomed) {
                d.welcomed = true;
                addCoins(player, CONFIG.startCoins);
                player.getComponent("minecraft:inventory").container.addItem(makeHubItem(player));
                saveData(player);
                bigTitle(player, CONFIG.brand, T("sys.welcomeSub"));
                notify(player, "ok", T("sys.welcomeMsg", { coins: CONFIG.startCoins }));
            } else {
                bigTitle(player, CONFIG.brand, T("sys.back", { name: player.name }));
            }
            sfx(player, "random.levelup");
        } else if (d.lastDeath) {
            notify(player, "info", useLang(player).T("sys.deathSaved"));
        }
    }, 40);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    dropCache(playerId);
    hudTimers.delete(playerId);
});

// ---------------------- /scriptevent nexus:menu ----------------------
system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }) => {
    if (id === "nexus:menu" && sourceEntity?.typeId === "minecraft:player") openHub(sourceEntity);
});