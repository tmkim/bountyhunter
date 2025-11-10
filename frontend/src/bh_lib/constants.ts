import { OnePieceDeck } from "@/bh_lib/types";

export const BASE_COST_MAP = new Map<string, number>([
  ["0", 0],
  ["1", 0],
  ["2", 0],
  ["3", 0],
  ["4", 0],
  ["5", 0],
  ["6", 0],
  ["7", 0],
  ["8", 0],
  ["9", 0],
  ["10", 0],
]);

export const BASE_RARITY_MAP = new Map<string, number>([
  ["C", 0],
  ["UC", 0],
  ["R", 0],
  ["SR", 0],
  ["L", 0],
  ["P", 0],
  ["DON", 0],
]);

export const BASE_COUNTER_MAP = new Map<string, number>([
  ["0", 0],
  ["1000", 0],
  ["2000", 0],
]);

export const EMPTY_DECK: OnePieceDeck = {
  id: "",
  user: "",
  name: "Untitled Deck",
  leader: null,
  cards: [],
  total_price: 0,
  cost_map: new Map(BASE_COST_MAP),
  rarity_map: new Map(BASE_RARITY_MAP),
  counter_map: new Map(BASE_COUNTER_MAP),
};