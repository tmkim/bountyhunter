// src/components/Navbar.tsx
export default function Navbar() {
    return (
        <header className="bg-maya shadow border-b-2 border-black">
            <nav className="w-full mx-auto flex items-center justify-between px-6 py-3">
                <h1 className="text-2xl font-bold text-black">Bountyhunter</h1>
                <div>
                    {/* Placeholder login/user menu */}
                    <button className="rounded bg-rosso px-3 py-1 text-white hover:bg-brown">
                        Login
                    </button>
                </div>
            </nav>
        </header>
    );
}
