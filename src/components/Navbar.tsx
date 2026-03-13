function Navbar() {
  const menu = ['Ejemplos', 'Documentacion', 'Ayuda', 'Gramaticas']

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
      <h1 className="text-lg font-semibold tracking-wide text-cyan-300">FLP Viewer</h1>
      <nav className="flex items-center gap-2 text-sm text-slate-300">
        {menu.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 transition hover:border-slate-500 hover:text-white"
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  )
}

export default Navbar