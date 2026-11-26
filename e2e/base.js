import { test as base, expect } from '@playwright/test'

// La mayoría de las pruebas parte de una persona que ya pasó la bienvenida (journey nuevo, S1).
// Solo se siembra si no hay perfil, así una recarga no pisa lo que la prueba guardó.
// El tema se fija en claro para que el resultado no dependa de la hora; la noche tiene su propia prueba.
export async function primerUsoHecho(contexto) {
  await contexto.addInitScript(() => {
    if (!localStorage.getItem('clima-interior:perfil')) {
      localStorage.setItem('clima-interior:perfil', JSON.stringify({ primerUso: { completo: true, edad: 'adulto' }, preferencias: { tema: 'claro' } }))
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
