function validateAlumno(data) {
  const { nombres, apellidos, matricula, promedio } = data;

  if (!nombres || typeof nombres !== 'string') return { valid: false, message: 'Nombre inválido.' };
  if (!apellidos || typeof apellidos !== 'string') return { valid: false, message: 'Apellido inválido.' };
  if (!matricula || typeof matricula !== 'string') return { valid: false, message: 'Matrícula inválida.' };
  if (promedio === undefined || typeof promedio !== 'number') return { valid: false, message: 'Promedio inválido.' };

  return { valid: true };
}

module.exports = { validateAlumno };