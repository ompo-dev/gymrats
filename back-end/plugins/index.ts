import type { Elysia } from "elysia";
import type { EventBus } from "../packages/events";

export type PluginDefinition = {
  name: string;
  featureId?: string;
  routes?: (app: Elysia) => Elysia;
  events?: (bus: EventBus) => void;
  metrics?: () => void;
  premium?: boolean;
};

const registry = new Map<string, PluginDefinition>();

export function registerPlugin(plugin: PluginDefinition) {
  registry.set(plugin.name, plugin);
  return plugin;
}

export function getPlugins() {
  return Array.from(registry.values());
}

export function applyPlugins(app: Elysia, bus: EventBus) {
  let current = app;
  getPlugins().forEach((plugin) => {
    if (plugin.routes) {
      current = plugin.routes(current);
    }
    if (plugin.events) {
      plugin.events(bus);
    }
    if (plugin.metrics) {
      plugin.metrics();
    }
  });

  return current;
}
