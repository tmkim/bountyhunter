// frontend/lib/indexedDB.ts
import { openDB } from "idb";
import { OnePieceCard } from "@/bh_lib/types";

const DB_NAME = "cardDB";
const STORE_NAME = "cards";

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      } 
    },
  });
}

export async function saveCards(cards: OnePieceCard[]) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  cards.forEach((card) => store.put(card));
  await tx.done;
}

export async function getAllCards(): Promise<OnePieceCard[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}
