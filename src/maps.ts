export type MapId = "classic" | "boulevard";

const MAP_STORAGE_KEY = "bolt-map";

export function getStoredMap(): MapId {
  try {
    return localStorage.getItem(MAP_STORAGE_KEY) === "boulevard" ? "boulevard" : "classic";
  } catch {
    return "classic";
  }
}

export function setStoredMap(mapId: MapId): void {
  try {
    localStorage.setItem(MAP_STORAGE_KEY, mapId);
  } catch {
    // The choice still applies to this session when storage is unavailable.
  }
}
