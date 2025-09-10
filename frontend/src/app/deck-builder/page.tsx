import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
    
export default function Page() {

  return (
    <div className="grid h-full grid-cols-[70%_30%] gap-4">
        {/* Left Column (Active Deck + Available Cards) */}
        <div className="flex flex-col gap-4">
            {/* #1 Active Deck */}
            <ActiveDeck />

            {/* #2 Available Cards + Filters */}
            <CardList />

        </div>

        {/* Right Column (#3 Card/Deck Details) */}
        <div className="flex flex-col">
            <DetailsPanel />
        </div>
    </div>
  );
}
