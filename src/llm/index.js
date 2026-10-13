import { validarRespuesta, RESPALDO_LOCAL } from './contrato.js'
import * as proveedores from './proveedores.js'

const TIEMPO_MAX_MS = 10000 // RNF-19: respuesta del LLM en 10 s o menos

export function proveedorActivo() {
  return proveedores[import.meta.env.VITE_LLM_PROVIDER] || proveedores.mock
}

// Punto único de entrada. Si el proveedor falla, tarda o responde fuera del esquema,
// se devuelve la reflexión local y la app sigue funcionando (RNF-23).
export async function proponerEmociones(texto) {
  const p = proveedorActivo()
  try {
    const r = await Promise.race([
      p.proponerEmociones(texto),
      new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), TIEMPO_MAX_MS)),
    ])
    return validarRespuesta(r) ? { ...r, proveedor: p.nombre } : RESPALDO_LOCAL
  } catch {
    return RESPALDO_LOCAL
  }
}
