type ConsoleOutputProps = {
  logs: string[]
}

function ConsoleOutput({ logs }: Readonly<ConsoleOutputProps>) {
  return (
    <section className="h-44 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
        Consola de ejecucion
      </h2>
      <div className="h-[calc(100%-2rem)] overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-xs text-slate-300">
        {logs.map((log, index) => (
          <div key={`${log}-${index}`} className="py-0.5">
            {`> ${log}`}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ConsoleOutput