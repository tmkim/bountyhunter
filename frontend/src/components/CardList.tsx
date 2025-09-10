export default function CardList() {
    return (
        <section className="flex-1 basis-2/5 rounded-lg bg-white shadow p-4 flex flex-col">
            <h2 className="mb-2 font-semibold text-lapis">
                Card List
            </h2>
            {/* 2a Filter + Search */}
            <div className="mb-4 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search cards..."
                    className="flex-grow rounded border px-2 py-1"
                />
                <button className="rounded bg-tangerine px-3 py-1 font-medium hover:bg-rosso hover:text-white">
                    Filter
                </button>
            </div>
            {/* Card pool goes here */}
        </section>
    );
}