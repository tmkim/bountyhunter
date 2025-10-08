import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { HistoryData } from "@/lib/types";

interface RawHistory{
    id: number;
    card_id: number;
    history_date: string;
    market_price: number;
}

export function useCardHistory(cardId?: number) {
    const shouldFetch = !!cardId;
    const { data, error, isLoading } = useSWR<RawHistory[]>(
    shouldFetch ? `http://localhost:8000/bounty_api/onepiece_cardhistory/?card_id=${cardId}` : null,
    fetcher
    );

    const history: HistoryData[] | undefined = data
        ?.filter((entry) => entry.market_price !== null) // optional filtering
        ?.map((entry) => ({
        date: entry.history_date,
        price: entry.market_price!, // or whichever price you want to plot
    }));

    return { history: history, isLoading, error };
}
