// src/components/ActiveDeck.tsx
export default function ActiveDeck() {
    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-x bg-lapis shadow p-4">
            <h2 className="mb-2 font-bold text-tangerine">Active Deck</h2>
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">

            </div>
            {/* Active deck cards go here */}
        </section>
    );
}
