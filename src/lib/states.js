import payload from "../../public/data/states.json";

export const statesPayload = payload;
export const states = payload.states;
export const categoriesMeta = payload.categories;
export const dataYear = payload.year;

export function getStateList() {
  return Object.entries(states).map(([abbr, state]) => ({ abbr, ...state }));
}

export function getStateBySlug(slug) {
  const match = Object.entries(states).find(([, state]) => state.slug === slug);
  if (!match) {
    return null;
  }
  const [abbr, state] = match;
  return { abbr, ...state };
}

export function getAbbrBySlug(slug) {
  const entry = getStateBySlug(slug);
  return entry?.abbr ?? null;
}
