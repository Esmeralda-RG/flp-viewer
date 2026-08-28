'use client'

import { useState } from 'react'
import Step from './Step'

export default function WelcomeModal() {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={() => setOpen(false)}
      />

      <div className="relative bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <div className="px-6 pt-6 pb-5 border-b border-[#3c3c3c]">
          <div className="flex items-center mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 leading-tight">Bienvenido a FLP Viewer</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Intérprete Educativo · Universidad del Valle</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Un playground para explorar fundamentos de lenguajes de programación.
            Escribe expresiones, visualiza el AST y observa cómo evoluciona el ambiente en tiempo real.
          </p>
        </div>

        <div className="px-6 py-5 border-b border-[#3c3c3c]">
          <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest mb-3">¿Cómo empezar?</p>
          <div className="space-y-3">
            <Step num={1}>
              Presiona{' '}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-800/40 border border-green-700/40 text-green-400 text-xs font-mono">
                ▶ Ejecutar
              </span>{' '}
              en la barra superior para activar la consola
            </Step>
            <Step num={2}>
              Escribe{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#444] text-sky-300 text-xs font-mono">
                print &quot;hola mundo&quot;
              </code>{' '}
              en la línea de comandos
            </Step>
            <Step num={3}>
              Presiona{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-[#2d2d2d] border border-[#555] text-zinc-300 text-xs font-mono shadow-sm">
                Enter
              </kbd>{' '}
              para evaluar la expresión
            </Step>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-[#3c3c3c]">
          <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest mb-3">Resultado esperado</p>
          <div className="rounded-lg border border-[#3c3c3c] overflow-hidden">
            <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
              <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wide">Consola</span>
            </div>

            <div className="bg-[#1a1a1a] p-3 font-mono text-xs space-y-1">
              <div className="flex gap-2 items-start text-zinc-400">
                <span className="shrink-0 w-6 text-right opacity-70">i</span>
                <span>Escribe una expresión y presiona Enter</span>
              </div>
              <div className="flex gap-2 items-start text-sky-300">
                <span className="shrink-0 w-6 text-right opacity-70">--&gt;</span>
                <span>print &quot;hola mundo&quot;</span>
              </div>
              <div className="flex gap-2 items-start text-green-400">
                <span className="shrink-0 w-6 text-right opacity-70">→</span>
                <span>&quot;hola mundo&quot;</span>
              </div>
            </div>

            <div className="border-t border-[#3c3c3c] bg-[#1a1a1a] flex items-center gap-2 px-3 py-2">
              <span className="text-sky-400 font-mono text-xs select-none">--&gt;</span>
              <span className="flex-1 font-mono text-xs text-zinc-400 italic">expresión…</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
          >
            ¡Empezar!
          </button>
          <p className="text-center text-[10px] text-zinc-400 mt-2.5">
            El ejemplo <span className="text-zinc-300">Hola Mundo</span> ya está cargado y listo para usar
          </p>
        </div>
      </div>
    </div>
  )
}
