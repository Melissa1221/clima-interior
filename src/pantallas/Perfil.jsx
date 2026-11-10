import { CATEGORIAS, cambiarCategoria, restablecer, borrarTodo, emocionesFavoritas } from '../datos/perfil.js'

// "Lo que sé de ti" (RF-23, HU-09): cada dato que usa la personalización se puede ver,
// apagar o borrar, y se muestra de dónde salió cada cambio que hizo la app (RF-22).
const duracion = (seg) => seg < 60
  ? `${seg} ${seg === 1 ? 'segundo' : 'segundos'}`
  : `${Math.floor(seg / 60)} min ${seg % 60} s`

function resumen(perfil, categoria) {
  const { ritmo, aprendizaje, preferencias } = perfil
  if (categoria === 'ritmo') {
    if (!ritmo.horaHabitual) return 'Todavía no lo sé.'
    const dura = ritmo.segundosCheckin ? ` Tus check-ins duran en promedio ${duracion(ritmo.segundosCheckin)}.` : ''
    return `Sueles venir a las ${ritmo.horaHabitual}:00.${dura}`
  }
  if (categoria === 'emocionesDeclaradas') {
    const fav = emocionesFavoritas(perfil)
    return fav.length ? `Sueles elegir: ${fav.join(', ')}. Te las ofrezco aunque la IA no las proponga.` : 'Aún no hay palabras que elijas seguido.'
  }
  if (categoria === 'emocionesInferidas') {
    const { propuestasIA: n, aceptadasIA: a } = aprendizaje
    return n ? `Aceptaste alguna propuesta de la IA en ${a} de ${n} check-ins.` : 'Aún no hay propuestas guardadas.'
  }
  if (categoria === 'entrada') {
    return preferencias.entrada === 'texto' ? 'Empiezas escribiendo.' : 'Empiezas hablando.'
  }
  return preferencias.frasesCortas ? 'Reflexiones de una sola frase.' : 'Reflexiones de hasta dos frases.'
}

export default function Perfil({ perfil, setPerfil, alVolver }) {
  function borrar() {
    if (window.confirm('¿Borrar todo lo que la app guardó en este dispositivo? No se puede deshacer.')) {
      setPerfil(borrarTodo())
    }
  }

  return (
    <section className="tarjeta historial perfil">
      <h2>Lo que sé de ti</h2>
      <p className="rotulo">Todo vive en este dispositivo. Apagar algo también borra lo que ya aprendí de eso.</p>

      <ul className="categorias">
        {Object.entries(CATEGORIAS).map(([id, nombre]) => (
          <li key={id} className="categoria">
            <label className="interruptor">
              <input type="checkbox" checked={perfil.activas[id]}
                onChange={(e) => setPerfil((p) => cambiarCategoria(p, id, e.target.checked))} />
              <strong>{nombre}</strong>
            </label>
            <p className="pequeno">{perfil.activas[id] ? resumen(perfil, id) : 'Apagado: no lo uso ni lo guardo.'}</p>
            {perfil.activas[id] && (
              <button className="enlace" onClick={() => {
                if (window.confirm(`¿Olvidar "${nombre.toLowerCase()}"? Tus registros del diario no se borran.`)) setPerfil((p) => restablecer(p, id))
              }}>Olvidar esto</button>
            )}
          </li>
        ))}
      </ul>

      <h3>Lo que cambié por mi cuenta</h3>
      {perfil.cambios.length ? (
        <ol className="cambios">
          {perfil.cambios.slice().reverse().map((c) => (
            <li key={c.fecha + c.que}>
              <strong>{c.que}</strong>
              <span className="pequeno">{c.fuente} · {new Date(c.fecha).toLocaleDateString('es-PE')}</span>
            </li>
          ))}
        </ol>
      ) : <p className="pequeno">Nada todavía. Si cambio algo, te diré por qué.</p>}

      <p className="pequeno">Llevas {perfil.registros.length} registro(s) guardados.</p>
      <button className="secundario" onClick={borrar}>Borrar todo</button>
      <button className="principal" onClick={alVolver}>Volver al inicio</button>
    </section>
  )
}
