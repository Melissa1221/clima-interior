"""Genera los datos simulados del modo demo: 30 días de registros de una persona ficticia y una sala compartida.

Uso: python3 scripts/generar_datos.py
Salida: public/demo/registros-30-dias.json y public/demo/sala-ejemplo.json

Ningún dato pertenece a una persona real. La semilla es fija para que la demo sea reproducible (RNF-30).
"""
import json
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(20261014)
RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "public" / "demo"

# valencia (-1 a 1), activación (0 a 1): de ahí sale el clima
EMOCIONES = {
    "calma": (0.6, 0.2), "alegría": (0.8, 0.7), "alivio": (0.5, 0.3), "gratitud": (0.7, 0.4),
    "cansancio": (-0.3, 0.1), "tristeza": (-0.7, 0.2), "frustración": (-0.6, 0.7),
    "ansiedad": (-0.5, 0.8), "preocupación": (-0.4, 0.6), "confusión": (-0.2, 0.5),
}
PALABRAS = ["trabajo", "tráfico", "sueño", "música", "familia", "parque", "lluvia", "examen", "amigos",
            "siesta", "cocinar", "llamada", "caminar", "clase", "café", "serie", "hermana", "deadline"]
FRASES = {
    "positivo": ["Hoy salí a caminar y me despejé bastante.", "Hablé con mi hermana y me reí un buen rato.",
                 "Terminé lo que tenía pendiente y me sentí ligera."],
    "negativo": ["Dormí poco y el tráfico me quitó energía.", "Tuve un examen y no me fue como esperaba.",
                 "Todo el día con la cabeza en el deadline."],
}


def clima(valencia, activacion):
    if valencia >= 0.4:
        return "soleado"
    if valencia >= 0:
        return "nublado"
    if activacion >= 0.65:
        return "tormenta"
    if activacion <= 0.25:
        return "niebla"
    return "lluvia"


def registros():
    inicio = date(2026, 9, 8)
    salida = []
    for i in range(30):
        dia = inicio + timedelta(days=i)
        if random.random() < 0.12:  # días sin registro: el historial los muestra como cielo despejado
            continue
        lunes = dia.weekday() == 0
        pool = ["cansancio", "preocupación", "tristeza", "confusión"] if lunes else list(EMOCIONES)
        declarada = random.choice(pool)
        val, act = EMOCIONES[declarada]
        val = max(-1, min(1, val + random.uniform(-0.15, 0.15)))
        act = max(0, min(1, act + random.uniform(-0.1, 0.1)))
        inferida = declarada if random.random() < 0.7 else random.choice(list(EMOCIONES))
        palabras = random.sample(PALABRAS, 3)
        if lunes:
            palabras[0] = "trabajo"
        relato = random.random() < 0.65  # en el resto se eligió solo el clima (camino rápido, RF-40)
        salida.append({
            "id": f"reg-{dia.isoformat()}",
            "fecha": dia.isoformat(),
            "hora": f"{random.randint(20, 23)}:{random.choice(['05', '18', '34', '47'])}",
            "clima": clima(val, act),
            "parametros": {
                "valencia": round(val, 2), "activacion": round(act, 2),
                "intensidad": round(random.uniform(0.3, 0.9), 2),
            },
            "emocion_declarada": declarada if random.random() > 0.08 else None,  # None = "no sé"
            "emocion_inferida": inferida if relato else None,
            "tres_palabras": palabras,
            "transcripcion": random.choice(FRASES["positivo" if val >= 0 else "negativo"]) if relato else None,
            "duracion_checkin_s": random.randint(45, 88) if relato else random.randint(6, 10),
            "respiracion_hecha": random.random() < 0.4,
        })
    return salida


def sala():
    return {
        "codigo": "K7QF-29XM-PL4D-8RWT",
        "caduca": "2026-10-15T23:59:00-05:00",
        "nota": "Solo se comparten parámetros del clima y seudónimos efímeros (RF-27, RNF-13, RNF-14).",
        "participantes": [
            {"seudonimo": f"Nube {i}", "clima": c, "valencia": v}
            for i, (c, v) in enumerate([("nublado", 0.1), ("lluvia", -0.4), ("soleado", 0.6),
                                        ("niebla", -0.2), ("soleado", 0.5)], start=1)
        ],
    }


if __name__ == "__main__":
    SALIDA.mkdir(parents=True, exist_ok=True)
    regs = registros()
    (SALIDA / "registros-30-dias.json").write_text(json.dumps(regs, ensure_ascii=False, indent=2))
    (SALIDA / "sala-ejemplo.json").write_text(json.dumps(sala(), ensure_ascii=False, indent=2))
    print(f"{len(regs)} registros en 30 días ({30 - len(regs)} sin registro) + 1 sala de ejemplo")
