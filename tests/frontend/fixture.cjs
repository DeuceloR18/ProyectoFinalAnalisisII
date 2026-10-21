// TEST DOUBLE ONLY. These rules do not implement or certify the real backend.
async function mockApi(page) {
  const state = {services:[], turns:[], fail:null, delay:0};
  await page.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url()), parts = url.pathname.split('/').filter(Boolean).slice(1);
    if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay));
    if (state.fail) return route.fulfill({status:503,json:{detail:state.fail}});
    const data = req.postDataJSON() || {};
    const respond = (json, status=200) => route.fulfill({status,json});
    const reject = detail => respond({detail},409);
    if (parts[0] === 'servicios' && parts.length === 1) {
      if (req.method() === 'GET') return respond(state.services);
      const nombre = data.nombre?.trim(), prefijo = data.prefijo?.trim().toUpperCase();
      if (!nombre || !prefijo) return reject('El nombre y el prefijo son obligatorios.');
      if (state.services.some(s => s.prefijo === prefijo)) return reject('El prefijo ya está en uso.');
      const service = {id:String(state.services.length+1),nombre,prefijo}; state.services.push(service); return respond(service,201);
    }
    if (parts[0] === 'turnos' && parts.length === 1) {
      const service = state.services.find(s => s.id === data.servicioId);
      if (!service) return reject('Selecciona un servicio válido.');
      const turn = {id:String(state.turns.length+1),servicioId:service.id,numero:`${service.prefijo}-${String(state.turns.filter(t=>t.servicioId===service.id).length+1).padStart(3,'0')}`,cliente:data.cliente,estado:'Esperando',generadoEn:'2026-10-20T10:00:00-06:00'};
      state.turns.push(turn); return respond(turn,201);
    }
    const active = state.turns.find(t=>t.servicioId === parts[1] && t.estado === 'En atención');
    const waiting = state.turns.filter(t=>t.servicioId === parts[1] && t.estado === 'Esperando' && !t.previousDay);
    if (parts[0] === 'servicios') {
      if (parts[2] === 'fila') return respond({total:waiting.length,turnos:waiting});
      if (parts[2] === 'actual') return respond(active || null);
      if (parts[2] === 'llamar') {
        if (active) return reject('Debes finalizar la atención actual antes de llamar a otro turno.');
        if (!waiting.length) return reject('No hay turnos en espera para este servicio');
        waiting[0].estado = 'En atención'; return respond(waiting[0]);
      }
      if (parts[2] === 'finalizar') {
        if (!active) return reject('No hay un turno en atención.');
        active.estado='Finalizado'; return respond(active);
      }
    }
    if (parts[0] === 'turnos' && parts[2] === 'cancelar') {
      const turn = state.turns.find(t=>t.id === parts[1]);
      if (!turn || turn.estado !== 'Esperando') return reject('El turno ya no está en espera.');
      turn.estado='Cancelado'; return respond(turn);
    }
    return respond({detail:'Ruta no implementada en fixture'},404);
  });
  return state;
}
module.exports = {mockApi};
