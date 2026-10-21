const {test,before,after,beforeEach,afterEach} = require('node:test');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {createServer} = require('./server.cjs');
const {mockApi} = require('./fixture.cjs');
const path = require('node:path');
let browser, server, page, state, base;
const shots = path.resolve(__dirname,'../../docs/pruebas/capturas');
before(async()=>{
  server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge',headless:true});
});
after(async()=>{await browser?.close(); await new Promise(resolve=>server.close(resolve));});
beforeEach(async()=>{page=await browser.newPage({viewport:{width:1440,height:1100}}); state=await mockApi(page); await page.goto(base); await page.getByText('No hay servicios registrados.').waitFor();});
afterEach(async()=>{await page.close();});
const notice=()=>page.locator('#notice').textContent();
async function service(nombre='Caja',prefijo='c') {
  await page.locator('#name').fill(nombre); await page.locator('#prefix').fill(prefijo); await page.getByRole('button',{name:'Registrar servicio',exact:true}).click();
  await page.getByText('Servicio registrado correctamente.').waitFor();
}
async function select(id='1') {await page.locator('#service').selectOption(id); await page.getByText('No hay personas en espera.',{exact:true}).waitFor();}
async function ticket(cliente='') {await page.locator('#client').fill(cliente); await page.getByRole('button',{name:'Generar turno',exact:true}).click(); await page.locator('#refresh').waitFor({state:'visible'}); await page.waitForFunction(()=>!document.querySelector('#refresh').disabled);}
test('SPEC-01: estado vacío, registro, mayúsculas, duplicado y espacios',async()=>{
  await page.screenshot({path:path.join(shots,'01-inicio.png'),fullPage:true});
  await service(); assert.equal(state.services[0].prefijo,'C'); assert.match(await page.locator('#services').textContent(),/Caja/);
  await page.locator('#name').fill('Otra caja'); await page.locator('#prefix').fill('c'); await page.getByRole('button',{name:'Registrar servicio',exact:true}).click(); await page.getByText('El prefijo ya está en uso.').waitFor(); assert.equal(state.services.length,1);
  await page.locator('#name').fill('   '); await page.locator('#prefix').fill('X'); await page.getByRole('button',{name:'Registrar servicio',exact:true}).click(); await page.getByText('El nombre y el prefijo son obligatorios.').waitFor(); assert.equal(state.services.length,1);
});
test('SPEC-02/03: selección obligatoria, nombre opcional, número y orden de fila',async()=>{
  await page.getByRole('button',{name:'Generar turno',exact:true}).click(); await page.getByText('Primero debes registrar un servicio.').waitFor();
  await service(); await select(); await ticket('Ana'); await ticket();
  assert.equal(await page.locator('#total').textContent(),'2'); assert.deepEqual(await page.locator('#queue tr td:nth-child(2)').allTextContents(),['C-001','C-002']);
  assert.deepEqual(await page.locator('#queue tr td:nth-child(3)').allTextContents(),['Ana','']);
  assert.equal(await page.locator('#issued-number').textContent(),'C-002');
  await page.screenshot({path:path.join(shots,'02-fila.png'),fullPage:true});
});
test('SPEC-03/04/05: llamar primero, bloquear segunda llamada, finalizar y no llamar automáticamente',async()=>{
  await service(); await select(); await ticket('Ana'); await ticket('Luis');
  await page.locator('#call').click(); await page.getByText('Llamada realizada correctamente.').waitFor(); assert.equal(await page.locator('#current').textContent(),'C-001'); assert.equal(await page.locator('#total').textContent(),'1');
  await page.screenshot({path:path.join(shots,'03-atencion.png'),fullPage:true});
  await page.locator('#call').click(); await page.getByText('Debes finalizar la atención actual antes de llamar a otro turno.').waitFor(); assert.equal(state.turns[1].estado,'Esperando');
  await page.locator('#finish').click(); await page.getByText('Atención finalizada correctamente.').waitFor(); assert.equal(await page.locator('#current').textContent(),'Ninguno'); assert.equal(state.turns[0].estado,'Finalizado'); assert.equal(state.turns[1].estado,'Esperando');
  await page.screenshot({path:path.join(shots,'06-finalizada.png'),fullPage:true});
  await page.locator('#finish').click(); await page.getByText('No hay un turno en atención.',{exact:true}).waitFor();
  await page.locator('#call').click(); await page.getByText('Llamada realizada correctamente.').waitFor(); assert.equal(await page.locator('#current').textContent(),'C-002');
});
test('SPEC-06: conservar, Escape, confirmar y renumerar posiciones',async()=>{
  await service(); await select(); await ticket(); await ticket(); await ticket();
  await page.getByRole('button',{name:'Cancelar turno C-002',exact:true}).click(); await page.getByRole('button',{name:'Conservar turno'}).click(); assert.equal(state.turns[1].estado,'Esperando');
  await page.getByRole('button',{name:'Cancelar turno C-002',exact:true}).click(); await page.keyboard.press('Escape'); assert.equal(state.turns[1].estado,'Esperando');
  await page.getByRole('button',{name:'Cancelar turno C-002',exact:true}).click(); await page.screenshot({path:path.join(shots,'04-confirmacion.png'),fullPage:true});
  await page.getByRole('button',{name:'Confirmar cancelación'}).click(); await page.getByText('Turno C-002 cancelado correctamente.').waitFor();
  assert.deepEqual(await page.locator('#queue tr td:first-child').allTextContents(),['1','2']); assert.deepEqual(await page.locator('#queue tr td:nth-child(2)').allTextContents(),['C-001','C-003']);
  await ticket(); assert.equal(await page.locator('#issued-number').textContent(),'C-004');
});
test('SPEC-06: conflicto de estado mientras la confirmación está abierta',async()=>{
  await service(); await select(); await ticket(); await page.getByRole('button',{name:'Cancelar turno C-001',exact:true}).click(); state.turns[0].estado='En atención';
  await page.getByRole('button',{name:'Confirmar cancelación'}).click(); await page.getByText('El turno ya no está en espera.').waitFor(); assert.equal(state.turns[0].estado,'En atención'); assert.equal(await page.locator('#current').textContent(),'C-001');
});
test('SPEC-03: cambio de servicio, consulta repetida y exclusión provista por API',async()=>{
  await service(); await service('Consultas','Q'); await select(); await ticket();
  state.turns.push({id:'old',numero:'C-099',servicioId:'1',estado:'Esperando',previousDay:true});
  const snapshot=JSON.stringify(state); await page.locator('#refresh').click(); await page.waitForFunction(()=>!document.querySelector('#refresh').disabled); assert.equal(JSON.stringify(state),snapshot); assert.equal(await page.locator('#total').textContent(),'1');
  await select('2'); assert.equal(await page.locator('#total').textContent(),'0'); await ticket(); assert.equal(await page.locator('#issued-number').textContent(),'Q-001');
  await page.locator('#service').selectOption(''); assert.equal(await page.locator('#queue tr').count(),0); await page.locator('#call').click(); await page.getByText('Selecciona un servicio.',{exact:true}).waitFor();
});
test('Conexión: error visible, datos obsoletos eliminados y recuperación',async()=>{
  await service(); await select(); await ticket(); state.fail='Servidor no disponible.'; await page.locator('#refresh').click(); await page.getByText('Servidor no disponible.',{exact:true}).waitFor(); assert.equal(await page.locator('#queue tr').count(),0);
  state.fail=null; await page.locator('#refresh').click(); await page.waitForFunction(()=>!document.querySelector('#refresh').disabled); assert.equal(await page.locator('#total').textContent(),'1');
});
test('Seguridad: los nombres se muestran como texto sin ejecutar HTML',async()=>{
  await service('<img src=x onerror=alert(1)>','X'); await select(); await ticket('<script>window.injected=true</script>'); assert.equal(await page.locator('#services img').count(),0); assert.equal(await page.locator('#queue script').count(),0); assert.equal(await page.evaluate(()=>window.injected),undefined);
});
test('Accesibilidad: etiquetas, teclado, foco de confirmación y móvil sin desbordamiento',async()=>{
  await service(); await select(); await ticket(); await page.getByRole('button',{name:'Cancelar turno C-001',exact:true}).click(); assert.equal(await page.locator('#keep').evaluate(el=>el===document.activeElement),true); await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844}); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.screenshot({path:path.join(shots,'05-movil.png'),fullPage:true});
  await page.keyboard.press('Control+Home'); await page.locator('#client').focus(); await page.keyboard.type('Teclado'); await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForFunction(()=>document.querySelector('#issued-number').textContent==='C-002');
});
test('SPEC-01/02/04: recarga vuelve a consultar datos del servidor',async()=>{
  await service(); await select(); await ticket('Ana'); await page.locator('#call').click(); await page.getByText('Llamada realizada correctamente.').waitFor(); await page.reload(); await page.locator('#service option[value="1"]').waitFor({state:'attached'}); await page.locator('#service').selectOption('1'); await page.waitForFunction(()=>document.querySelector('#current').textContent==='C-001'); assert.equal(await page.locator('#current-client').textContent(),'Ana');
});
test('Errores de transporte y JSON inválido se informan sin crear turnos',async()=>{
  await service(); await select();
  await page.route('**/api/turnos',route=>route.abort('failed'));
  await ticket(); assert.match(await notice(),/No se pudo conectar/); assert.equal(state.turns.length,0);
  await page.unroute('**/api/turnos');
  await page.route('**/api/turnos',route=>route.fulfill({status:200,contentType:'text/html',body:'<html>Error</html>'}));
  await ticket(); assert.match(await notice(),/respuesta no válida/); assert.equal(state.turns.length,0);
});
test('Una solicitud en curso bloquea acciones repetidas hasta finalizar',async()=>{
  await service(); await select(); state.delay=250;
  await page.locator('#ticket-form').dispatchEvent('submit');
  await page.waitForFunction(()=>document.querySelector('#call').disabled);
  await page.locator('#ticket-form').dispatchEvent('submit');
  await page.waitForFunction(()=>!document.querySelector('#call').disabled);
  assert.equal(state.turns.length,1); assert.equal(await page.locator('#total').textContent(),'1');
});
test('SPEC-04: fila vacía y atención de otro día se comunican correctamente',async()=>{
  await service(); await select(); await page.locator('#call').click(); await page.getByText('No hay turnos en espera para este servicio',{exact:true}).waitFor();
  state.turns.push({id:'old',servicioId:'1',numero:'C-099',estado:'En atención',previousDay:true});
  await page.locator('#refresh').click(); await page.waitForFunction(()=>!document.querySelector('#refresh').disabled);
  assert.equal(await page.locator('#current').textContent(),'C-099'); await page.locator('#call').click(); await page.getByText('Debes finalizar la atención actual antes de llamar a otro turno.').waitFor();
});
test('Servidor de vista previa comunica que el backend está pendiente',async()=>{
  const response=await page.request.get(`${base}/api/servicios`); assert.equal(response.status(),503); assert.match((await response.json()).detail,/backend todavía no está conectado/);
});
