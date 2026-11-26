// B6: el saludo depende de la hora, no del tema. Con el tema noche fijo a las 10:00 decía «Buenas noches».
export function saludo(hora = new Date().getHours()) {
  return hora >= 19 || hora < 5 ? 'Buenas noches, ¿cómo va tu cielo?' : '¿Cómo va tu cielo hoy?'
}
