import nigeria from "nigeria-state-lga-data";

const api = nigeria?.default || nigeria;

export function getNigeriaStates() {
  return api.getStates();
}

export function getNigeriaLgas(state) {
  if (!state) return [];
  return api.getLgas(state) || [];
}
