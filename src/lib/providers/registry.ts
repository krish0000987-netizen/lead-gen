import { DataProvider, DataProviderConstructor, ProviderId } from "./types";

const registry = new Map<ProviderId, DataProviderConstructor>();

export function registerProvider(id: ProviderId, ctor: DataProviderConstructor) {
  registry.set(id, ctor);
}

export function getProviderConstructor(id: ProviderId): DataProviderConstructor | undefined {
  return registry.get(id);
}

export function createProvider(id: ProviderId, connection: any): DataProvider | null {
  const ctor = registry.get(id);
  if (!ctor) return null;
  return new ctor(connection);
}

export function listProviders(): { id: ProviderId; displayName: string }[] {
  return Array.from(registry.entries()).map(([id, ctor]) => ({
    id,
    displayName: new ctor({}).getProviderInfo().displayName,
  }));
}
