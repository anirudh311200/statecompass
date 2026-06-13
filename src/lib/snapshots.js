import payload from "../../public/data/founder_snapshots.json";

export const snapshotsPayload = payload;
export const snapshotDisclaimer = payload.disclaimer;
export const snapshots = payload.states;

export function getSnapshotForState(abbr) {
  return snapshots[abbr] ?? null;
}
