export type OnePieceCard = {
  id: number;
  product_id: number;
  foil_type: string;

  name: string;
  image_url?: string | null;
  tcgplayer_url?: string | null;
  market_price: number;

  rarity?: string | null;
  card_id?: string | null;
  description?: string | null;
  color?: string | null;
  card_type?: string | null;
  life?: number | null;
  power?: number | null;
  subtype?: string | null;
  attribute?: string | null;
  cost?: number | null;
  counter?: number | null;

  last_update: string; // could be Date if you parse it on the frontend
};

export type OnePieceCardHistory = {
  // card: OnePieceCard;
  id: number;
  history_date: string;
  market_price: number;
  card_id: number;
}

export interface HistoryData{
    date: string;
    price: number;
}