# Guion del video

Video sin narración: el grupo graba la voz leyendo cada bloque y la deja en `video-salida/narracion/NN.m4a` (o `.mp3`, `.wav`); `npm run video:montar` la mezcla y alarga cada escena si hace falta.

| Escena | Qué se ve | Pantallas | Duración aprox. |
|---|---|---|---|
| 00 | Clima Interior | — | 7 s |
| 01 | El problema | — | 16 s |
| 02 | Primer uso y consentimiento | S01 a S05 | 34 s |
| 03 | Check-in por voz, emociones y reflexión | S06, S07, S08, S15, S17, S19, S27 | 43 s |
| 04 | Seguridad: señales de riesgo | S22 | 18 s |
| 05 | Historial de 30 días | S30 | 12 s |
| 06 | Perfil y privacidad | S40, S42 | 22 s |
| 07 | Exportar resumen y eliminar datos | S43, S44, S45 | 35 s |
| 08 | Accesibilidad | S46 a S49 | 41 s |
| 09 | PWA: instalar y usar sin conexión | S54, S55 | 21 s |
| 10 | Trazabilidad y arquitectura | — | 18 s |
| 11 | Gracias | — | 8 s |

## 00 · Clima Interior

*Diario emocional generativo*

> Clima Interior es un diario emocional generativo: cuentas tu día en un minuto y lo ves convertido en un clima.

## 01 · El problema

*A muchas personas les cuesta ponerle nombre a lo que sienten*

> A muchas personas les cuesta ponerle nombre a lo que sienten, y los formularios y las encuestas no ayudan. Clima Interior propone otra cosa: elegir un clima, contar el día si quieres, y decidir tú qué palabras son tuyas. La IA propone, la persona decide.

## 02 · Primer uso y consentimiento

*Edad, cuatro permisos por separado, límites y ajustes iniciales*

> La primera vez, la app te recibe sin pedirte nada: puedes mirar la demo de treinta días o empezar. Primero, tu edad, porque las emociones son un dato sensible. Después, cuatro permisos por separado, todos apagados: nada sale de tu teléfono sin tu permiso. Luego, lo que la app es y lo que no es: no diagnostica ni reemplaza a una persona profesional. Y por último, ajustes de accesibilidad desde el primer minuto.

## 03 · Check-in por voz, emociones y reflexión

*El clima primero; contarlo es opcional*

> Para el check-in eliges el clima de hoy. Con eso basta si no tienes ganas de hablar. Si quieres contarlo, un aviso te recuerda cómo cuidamos tu privacidad. Mientras dictas, ves el micrófono activo y puedes terminar con la voz. Revisas lo que entendimos y lo corriges antes de que lo lea la IA. Entonces la IA propone emociones, siempre con su etiqueta, y tú eliges las tuyas o marcas no sé. Al guardar, lo que propuso la IA queda aparte de lo que tú elegiste.

## 04 · Seguridad: señales de riesgo

*Un detector independiente del modelo, antes de cualquier reflexión*

> Antes de cualquier reflexión corre un detector de riesgo, independiente del modelo. Si aparece una señal, no se reflexiona: se muestran la Línea 113, el SAMU 106 y la PNP 105. La app no contacta a nadie.

## 05 · Historial de 30 días

*Sin rachas ni culpa: un día sin registro no es un fallo*

> El historial muestra treinta días simulados. Los días sin registro no se marcan como fallo: el cielo sigue despejado.

## 06 · Perfil y privacidad

*Cada dato y cada permiso se apagan por separado*

> En Perfil ves lo que la app sabe de ti y apagas cada dato. En Privacidad cambias los permisos y eliges dónde se genera la reflexión: en tu dispositivo o en internet.

## 07 · Exportar resumen y eliminar datos

*Se genera en el teléfono, sin lo que propuso la IA*

> Puedes exportar un resumen para tu psicóloga o psicólogo: tú eliges qué incluir y se genera en tu teléfono. Nunca lleva lo que propuso la IA. Si no hay registros en esas fechas, no se genera un archivo vacío. Y puedes eliminar todos tus datos, escribiendo la palabra borrar.

## 08 · Accesibilidad

*Movimiento reducido, capas, modo neutral y modo predecible*

> En Accesibilidad activas movimiento reducido y apagas cada capa del clima por separado. El modo neutral muestra una tormenta como un cielo neutro, sin sonidos intensos. El modo predecible hace una pregunta por pantalla. También hay descripción hablada, vibración y órdenes de voz.

## 09 · PWA: instalar y usar sin conexión

*La ayuda en crisis también funciona sin red*

> Clima Interior es una PWA: se instala en la pantalla de inicio y funciona sin conexión, incluida la ayuda en crisis.

## 10 · Trazabilidad y arquitectura

*35 de 76 requerimientos implementados, 18 parciales y 23 pendientes*

> Cada historia de usuario se enlaza con sus requerimientos, el código y las pruebas en un reporte que se genera solo. Hoy, 35 de 76 requerimientos están implementados, 18 parciales y 23 pendientes, y el reporte dice cuáles faltan y por qué.

## 11 · Gracias

*Clima Interior · Grupo 8 · CC451 Interacción Humano-Computador*

> Gracias. El código, la arquitectura y el reporte de trazabilidad están en el repositorio del proyecto.
