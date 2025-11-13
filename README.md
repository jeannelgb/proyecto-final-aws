# API REST - Alumnos y Profesores

Aplicación REST construida con Node.js y Express.  
Datos almacenados en memoria (sin base de datos).

## 🚀 Endpoints disponibles

### Alumnos
- GET /alumnos
- GET /alumnos/:id
- POST /alumnos
- PUT /alumnos/:id
- DELETE /alumnos/:id

### Profesores
- GET /profesores
- GET /profesores/:id
- POST /profesores
- PUT /profesores/:id
- DELETE /profesores/:id

## 🧩 Ejemplo de cuerpo JSON (POST)
### Alumno
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "matricula": "A123",
  "promedio": 9.2
}