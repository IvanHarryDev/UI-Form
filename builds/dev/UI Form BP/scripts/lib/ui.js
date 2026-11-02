import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// ============================================================

const has = (obj, method) => typeof obj?.[method] === "function";
const sleep = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

export async function showForm(player, form, { retries = 30, interval = 10 } = {}) {
    for (let i = 0; i <= retries; i++) {
        let res;
        try {
            res = await form.show(player);
        } catch (e) {
            console.warn(`[NEXUS] Could not show the form: ${e}`);
            return { canceled: true, cancelationReason: "Error" };
        }
        if (res.canceled && res.cancelationReason === "UserBusy") {
            await sleep(interval);
            continue;
        }
        return res;
    }
    return { canceled: true, cancelationReason: "UserBusy" };
}

export class Menu {
    constructor(title) {
        this.form = new ActionFormData().title(title);
        this.actions = [];
        this.fallbackText = [];
    }

    header(text) {
        if (has(this.form, "header")) this.form.header(text);
        else this.fallbackText.push(text);
        return this;
    }

    label(text) {
        if (has(this.form, "label")) this.form.label(text);
        else this.fallbackText.push(text);
        return this;
    }

    divider() {
        if (has(this.form, "divider")) this.form.divider();
        return this;
    }

    button(text, icon, action) {
        if (icon) this.form.button(text, icon);
        else this.form.button(text);
        this.actions.push(action);
        return this;
    }

    async show(player) {
        if (this.fallbackText.length) this.form.body(this.fallbackText.join("\n"));
        const res = await showForm(player, this.form);
        if (res.canceled || res.selection === undefined) return "close";
        try {
            return (await this.actions[res.selection]?.()) ?? "stay";
        } catch (e) {
            console.warn(`[NEXUS] Error in a menu action: ${e}\n${e?.stack ?? ""}`);
            return "stay";
        }
    }
}

export class Modal {
    constructor(title) {
        this.form = new ModalFormData().title(title);
        this.layout = [];
    }

    _decor(method, ...args) {
        if (has(this.form, method)) {
            this.form[method](...args);
            this.layout.push({});
        }
        return this;
    }

    header(text) {
        return this._decor("header", text);
    }
    label(text) {
        return this._decor("label", text);
    }
    divider() {
        return this._decor("divider");
    }

    toggle(key, label, defaultValue = false, tooltip) {
        const opts = { defaultValue };
        if (tooltip) opts.tooltip = tooltip;
        this.form.toggle(label, opts);
        this.layout.push({ key });
        return this;
    }

    slider(key, label, min, max, step = 1, defaultValue = min, tooltip) {
        const opts = { valueStep: step, defaultValue };
        if (tooltip) opts.tooltip = tooltip;
        this.form.slider(label, min, max, opts);
        this.layout.push({ key });
        return this;
    }

    dropdown(key, label, items, defaultValueIndex = 0, tooltip) {
        const opts = { defaultValueIndex };
        if (tooltip) opts.tooltip = tooltip;
        this.form.dropdown(label, items, opts);
        this.layout.push({ key });
        return this;
    }

    textField(key, label, placeholder, defaultValue = "", tooltip) {
        const opts = { defaultValue };
        if (tooltip) opts.tooltip = tooltip;
        this.form.textField(label, placeholder, opts);
        this.layout.push({ key });
        return this;
    }

    submit(text) {
        if (has(this.form, "submitButton")) this.form.submitButton(text);
        return this;
    }

    async show(player) {
        const res = await showForm(player, this.form);
        if (res.canceled || !res.formValues) return null;

        const values = res.formValues;
        const fullLayout = values.length === this.layout.length;
        const out = {};
        let n = 0;
        this.layout.forEach((entry, i) => {
            if (!entry.key) return;
            out[entry.key] = fullLayout ? values[i] : values[n];
            n++;
        });
        return out;
    }
}