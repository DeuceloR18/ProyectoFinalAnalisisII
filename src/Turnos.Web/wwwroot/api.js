// Presentation adapter. Business rules and persistence belong to the .NET backend.
export async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, {
      method, signal: controller.signal, headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    let parsed = true;
    const data = response.status === 204 ? null : await response.json().catch(() => { parsed = false; return null; });
    if (!response.ok) throw new Error(data?.detail || data?.message || 'No se pudo completar la operación. Actualiza la fila e intenta de nuevo.');
    if (!parsed) throw new Error('El servidor devolvió una respuesta no válida.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('El servidor tardó demasiado. Actualiza la fila antes de volver a intentar.');
    if (error instanceof TypeError) throw new Error('No se pudo conectar al servidor. Comprueba la conexión e intenta de nuevo.');
    throw error;
  } finally { clearTimeout(timeout); }
}
