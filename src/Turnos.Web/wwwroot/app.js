import { request } from './api.js';
const $ = id => document.getElementById(id);
let services = [], revision = 0, pendingCancel = null, busy = false;
$('date').textContent = new Intl.DateTimeFormat('es-GT', {dateStyle:'long'}).format(new Date());
function message(text, error = false) {
  $('notice').textContent = text;
  $('notice').className = error ? 'error' : '';
  $('notice').hidden = false;
}
function clearView(text = 'Selecciona un servicio para consultar su fila.') {
  $('queue').replaceChildren(); $('total').textContent = '0'; $('queue-table').hidden = true;
  $('queue-empty').textContent = text; $('queue-empty').hidden = false;
  $('current').textContent = 'Ninguno'; $('current-client').textContent = '';
}
async function run(action) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('button, input, select').forEach(el => el.disabled = true);
  try { await action(); } catch (error) { message(error.message, true); }
  finally { busy = false; document.querySelectorAll('button, input, select').forEach(el => el.disabled = false); }
}
function selected() {
  if (!$('service').value) throw new Error(services.length ? 'Selecciona un servicio.' : 'Primero debes registrar un servicio.');
  return encodeURIComponent($('service').value);
}
async function loadServices() {
  services = await request('/servicios');
  const previous = $('service').value;
  $('service').replaceChildren(new Option('Selecciona un servicio', ''));
  $('services').replaceChildren();
  for (const service of services) {
    $('service').add(new Option(`${service.nombre} (${service.prefijo})`, service.id));
    const item = document.createElement('li'), badge = document.createElement('b'), name = document.createElement('span');
    badge.textContent = service.prefijo; name.textContent = service.nombre; item.append(badge, name); $('services').append(item);
  }
  if (!services.length) { const item = document.createElement('li'); item.textContent = 'No hay servicios registrados.'; $('services').append(item); }
  $('service').value = previous;
}
async function refresh() {
  const id = selected(), currentRevision = ++revision;
  clearView('Consultando fila…');
  try {
    const [queue, current] = await Promise.all([request(`/servicios/${id}/fila`), request(`/servicios/${id}/actual`)]);
    if (currentRevision !== revision) return;
    $('current').textContent = current?.numero || 'Ninguno'; $('current-client').textContent = current?.cliente || '';
    $('total').textContent = String(queue.total);
    $('queue-empty').textContent = 'No hay personas en espera.'; $('queue-empty').hidden = queue.turnos.length > 0;
    $('queue-table').hidden = !queue.turnos.length;
    for (const [index, turn] of queue.turnos.entries()) {
      const row = document.createElement('tr');
      for (const text of [index + 1, turn.numero, turn.cliente || '']) { const cell = document.createElement('td'); cell.textContent = text; row.append(cell); }
      const cell = document.createElement('td'), button = document.createElement('button');
      button.textContent = 'Cancelar'; button.setAttribute('aria-label', `Cancelar turno ${turn.numero}`);
      button.addEventListener('click', () => { pendingCancel = turn; $('cancel-description').textContent = `¿Deseas cancelar el turno ${turn.numero}?`; $('cancel-dialog').showModal(); $('keep').focus(); });
      cell.append(button); row.append(cell); $('queue').append(row);
    }
  } catch (error) { clearView('No se pudo consultar la fila. Pulsa Actualizar fila para reintentar.'); throw error; }
}
$('service-form').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const nombre = $('name').value.trim(), prefijo = $('prefix').value.trim();
    if (!nombre || !prefijo) throw new Error('El nombre y el prefijo son obligatorios.');
    await request('/servicios', {method:'POST', body:{nombre,prefijo}});
    await loadServices(); $('service-form').reset(); message('Servicio registrado correctamente.');
  });
});
$('service').addEventListener('change', () => { ++revision; clearView(); $('issued').hidden = true; $('notice').hidden = true; if ($('service').value) run(refresh); });
$('refresh').addEventListener('click', () => run(refresh));
$('ticket-form').addEventListener('submit', event => {
  event.preventDefault(); run(async () => {
    const id = selected();
    const turn = await request('/turnos', {method:'POST', body:{servicioId:decodeURIComponent(id), cliente:$('client').value.trim() || null}});
    $('issued-number').textContent = turn.numero;
    $('issued-detail').textContent = `${services.find(service => String(service.id) === decodeURIComponent(id))?.nombre || ''} · ${turn.estado} · ${new Date(turn.generadoEn).toLocaleString('es-GT')}`;
    $('issued').hidden = false; $('client').value = ''; message(`Turno ${turn.numero} generado correctamente.`); await refresh();
  });
});
for (const [button, action, confirmation] of [['call','llamar','Llamada realizada'], ['finish','finalizar','Atención finalizada']]) {
  $(button).addEventListener('click', () => run(async () => {
    const id = selected();
    try { await request(`/servicios/${id}/${action}`, {method:'POST'}); }
    catch (error) { await refresh().catch(() => {}); throw error; }
    message(`${confirmation} correctamente.`); await refresh();
  }));
}
$('keep').addEventListener('click', () => $('cancel-dialog').close());
$('cancel-dialog').addEventListener('close', () => { pendingCancel = null; });
$('confirm-cancel').addEventListener('click', () => run(async () => {
  if (!pendingCancel) return;
  const turn = pendingCancel;
  try { await request(`/turnos/${encodeURIComponent(turn.id)}/cancelar`, {method:'POST'}); $('cancel-dialog').close(); message(`Turno ${turn.numero} cancelado correctamente.`); await refresh(); }
  catch (error) { $('cancel-dialog').close(); await refresh().catch(() => {}); throw error; }
}));
run(loadServices);
