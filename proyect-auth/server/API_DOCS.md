# 📚 Documentación API - Hackscate

## Base URL

**Producción:** `https://auth-production-286b.up.railway.app`

**Local:** `http://localhost:3000`

---

## 📅 Horario

### Obtener horario

Retorna el horario de clases del estudiante con información de la sala donde se imparte cada clase.

- **URL:** `/horario`
- **Método:** `GET`

#### Response

```json
[
  {
    "dia": "Lunes",
    "inicio": "10:00",
    "fin": "11:20",
    "ramo": "Cálculo",
    "sala_id": "sur_lab_a",
    "sala": {
      "nombre": "Laboratorio de Computación A",
      "id": "sur_lab_a",
      "piso": 1,
      "coordenadas": { "x": 24.0, "y": 24.0 },
      "edificio_id": "comp_sur",
      "edificio_nombre": "Complejo de Edificios Suroeste"
    }
  },
  {
    "dia": "Lunes",
    "inicio": "12:00",
    "fin": "13:20",
    "ramo": "Física",
    "sala_id": "cen_am",
    "sala": {
      "nombre": "Aula Magna",
      "id": "cen_am",
      "capacidad": 300,
      "coordenadas": { "x": 50.0, "y": 50.0 },
      "edificio_id": "edi_cen",
      "edificio_nombre": "Edificios Centrales"
    }
  }
]
```

---

## 📝 Notas

### Obtener notas

Retorna las notas del estudiante.

- **URL:** `/notas`
- **Método:** `GET`

#### Response

```json
[
  {
    "ramo": "Cálculo",
    "nota": 5.6
  },
  {
    "ramo": "Física",
    "nota": 4.8
  }
]
```

---

## 🎉 Eventos

### Obtener todos los eventos

Retorna la lista de todos los eventos creados con información de ubicación.

- **URL:** `/evento`
- **Método:** `GET`

#### Response

```json
[
  {
    "id": 1,
    "titulo": "Hackathon 2025",
    "descripcion": "Evento de programación",
    "fecha": "2025-12-10",
    "hora": "10:00",
    "creador": "admin@mail.com",
    "ubicacion_id": "cen_am",
    "ubicacion": {
      "tipo": "sala",
      "nombre": "Aula Magna",
      "id": "cen_am",
      "capacidad": 300,
      "coordenadas": { "x": 50.0, "y": 50.0 },
      "edificio_id": "edi_cen",
      "edificio_nombre": "Edificios Centrales"
    }
  }
]
```

---

### Crear evento

Crea un nuevo evento. Usa `ubicacion_id` para asociar el evento a una sala o punto de interés del campus.

- **URL:** `/evento`
- **Método:** `POST`
- **Headers:** `Content-Type: application/json`

#### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| titulo | string | ✅ | Nombre del evento |
| descripcion | string | ❌ | Descripción del evento |
| ubicacion_id | string | ❌ | ID de sala del mapa (ej: `cen_am`, `sur_lab_a`) |
| fecha | string | ❌ | Fecha del evento (YYYY-MM-DD) |
| hora | string | ❌ | Hora del evento (HH:MM) |
| creador | string | ❌ | Email del creador |

#### Ejemplo Request

```json
{
  "titulo": "Hackathon 2025",
  "descripcion": "Evento de programación",
  "ubicacion_id": "cen_am",
  "fecha": "2025-12-10",
  "hora": "10:00",
  "creador": "usuario@mail.com"
}
```

#### Response (201 Created)

```json
{
  "id": 2,
  "titulo": "Hackathon 2025",
  "descripcion": "Evento de programación",
  "fecha": "2025-12-10",
  "hora": "10:00",
  "creador": "usuario@mail.com",
  "ubicacion_id": "cen_am",
  "ubicacion": {
    "tipo": "sala",
    "nombre": "Aula Magna",
    "id": "cen_am",
    "capacidad": 300,
    "coordenadas": { "x": 50.0, "y": 50.0 },
    "edificio_id": "edi_cen",
    "edificio_nombre": "Edificios Centrales"
  }
}
```

#### IDs de salas disponibles

| ID | Sala | Edificio |
|----|------|----------|
| `cm_recep` | Recepción | Centro Médico UC |
| `cm_con_01` | Consulta General 1 | Centro Médico UC |
| `cm_lab_01` | Laboratorio de Muestras | Centro Médico UC |
| `preu_101` | Sala P-101 | Preuniversitario UC |
| `preu_102` | Sala P-102 | Preuniversitario UC |
| `sur_lab_a` | Laboratorio de Computación A | Complejo Suroeste |
| `sur_estudio` | Sala de Estudio Silencioso | Complejo Suroeste |
| `sur_aud` | Auditorio Sur | Complejo Suroeste |
| `cen_am` | Aula Magna | Edificios Centrales |
| `cen_cafe` | Cafetería Principal | Edificios Centrales |
| `cen_lib` | Librería UC | Edificios Centrales |
| `nor_dec_ing` | Decanato de Ingeniería | Sector Nororiente |
| `nor_grados` | Sala de Grados | Sector Nororiente |
| `nor_lab_red` | Laboratorio de Redes | Sector Nororiente |
  "id": 2,
  "titulo": "Hackathon 2025",
  "descripcion": "Evento de programación",
  "latitud": -33.45,
  "longitud": -70.66,
  "fecha": "2025-12-10",
  "hora": "10:00",
  "creador": "usuario@mail.com"
}
```

---

## 📍 Ubicaciones

### Obtener mapa completo

Retorna toda la información del mapa: metadata, edificios, salas y puntos de interés.

- **URL:** `/ubicaciones`
- **Método:** `GET`

---

### Obtener edificios

Retorna solo la lista de edificios y complejos.

- **URL:** `/ubicaciones/edificios`
- **Método:** `GET`

#### Response

```json
[
  {
    "nombre": "Centro Médico UC San Joaquín",
    "id": "cm_uc",
    "tipo": "complejo_edificios",
    "punto_central": { "x": 25, "y": 75 },
    "salas": [...]
  }
]
```

---

### Obtener edificio por ID

Retorna un edificio específico con sus salas.

- **URL:** `/ubicaciones/edificios/:id`
- **Método:** `GET`

#### Ejemplo

`GET /ubicaciones/edificios/cm_uc`

---

### Obtener todas las salas

Retorna todas las salas de todos los edificios con información del edificio al que pertenecen.

- **URL:** `/ubicaciones/salas`
- **Método:** `GET`

#### Response

```json
[
  {
    "nombre": "Recepción",
    "id": "cm_recep",
    "piso": 1,
    "coordenadas": { "x": 25.0, "y": 74.5 },
    "edificio_id": "cm_uc",
    "edificio_nombre": "Centro Médico UC San Joaquín"
  }
]
```

---

### Obtener sala por ID

Retorna una sala específica.

- **URL:** `/ubicaciones/salas/:id`
- **Método:** `GET`

#### Ejemplo

`GET /ubicaciones/salas/cm_recep`

---

### Obtener puntos de interés

Retorna puntos de interés como la laguna, áreas verdes, campos deportivos, etc.

- **URL:** `/ubicaciones/puntos-interes`
- **Método:** `GET`

#### Response

```json
[
  {
    "nombre": "Laguna",
    "tipo": "cuerpo_de_agua",
    "descripcion": "Cuerpo de agua distintivo en el lado este del campus.",
    "punto_central": { "x": 78, "y": 48 }
  }
]
```

---

## 🔧 Ejemplos con Fetch (JavaScript)

### GET - Obtener horario

```javascript
const response = await fetch('https://auth-production-286b.up.railway.app/horario');
const horario = await response.json();
console.log(horario);
```

### GET - Obtener eventos

```javascript
const response = await fetch('https://auth-production-286b.up.railway.app/evento');
const eventos = await response.json();
console.log(eventos);
```

### POST - Crear evento

```javascript
const nuevoEvento = {
  titulo: "Mi evento",
  descripcion: "Descripción del evento",
  fecha: "2025-12-15",
  hora: "18:00"
};

const response = await fetch('https://auth-production-286b.up.railway.app/evento', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(nuevoEvento)
});

const eventoCreado = await response.json();
console.log(eventoCreado);
```

---

## ⚠️ Notas importantes

- Los datos de **horario** y **notas** son mocks estáticos (no cambian)
- Los **eventos** se pueden crear y listar dinámicamente
- La API no requiere autenticación por ahora
- CORS está habilitado para cualquier origen
