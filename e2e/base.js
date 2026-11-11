import { test as base, expect } from '@playwright/test'

// La mayoría de las pruebas parte de una persona que ya pasó el primer uso (S01-S05).
// Solo se siembra si no hay perfil, así una recarga no pisa lo que la prueba guardó.
export async function primerUsoHecho(contexto) {
  await contexto.addInitScript(() => {
    if (!localStorage.getItem('clima-interior:perfil')) {
      localStorage.setItem('clima-interior:perfil', JSON.stringify({ primerUso: { completo: true, edad: 'adulto' } }))
    }
  })
}

export const test = base.extend({
  nuevo: [false, { option: true }],
  context: async ({ context, nuevo }, usar) => {
    if (!nuevo) await primerUsoHecho(context)
    await usar(context)
  },
})
export { expect }
