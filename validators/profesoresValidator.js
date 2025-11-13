function validateProfesor(data) {
  const { numeroEmpleado, nombres, apellidos, horasClase } = data;

  if (!numeroEmpleado || typeof numeroEmpleado !== 'string') return { valid: false, message: 'Número de empleado inválido.' };
  if (!nombres || typeof nombres !== 'string') return { valid: false, message: 'Nombre inválido.' };
  if (!apellidos || typeof apellidos !== 'string') return { valid: false, message: 'Apellido inválido.' };
  if (horasClase === undefined || typeof horasClase !== 'number') return { valid: false, message: 'Horas de clase inválidas.' };

  return { valid: true };
}

module.exports = { validateProfesor };