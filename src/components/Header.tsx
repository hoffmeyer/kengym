export default function Header() {
  return (
    <header className="bg-gray-900 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        <img
          src="/logo.png"
          alt="Hvidovre Atletik & Motion"
          className="h-14 w-14 rounded-full object-cover ring-2 ring-white/20"
        />
        <div>
          <h1 className="text-white text-xl font-bold leading-tight">
            Kænturjon gym
          </h1>
          <p className="text-gray-400 text-sm">CrossFit – Holdtræning</p>
        </div>
      </div>
    </header>
  );
}
