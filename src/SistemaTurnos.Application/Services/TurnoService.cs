
using SistemaTurnos.Application.Interfaces;
using SistemaTurnos.Domain.Models;

namespace SistemaTurnos.Application.Services;

public class TurnoService
{
    private readonly ITurnoRepository _turnos;
    private readonly IServicioRepository _servicios;

    public TurnoService(
        ITurnoRepository turnos,
        IServicioRepository servicios)
    {
        _turnos = turnos;
        _servicios = servicios;
    }

    public async Task<int> CrearAsync(
        int servicioId, string? nombreCliente)
    {
        var servicio = await _servicios.ObtenerPorIdAsync(servicioId);

        if (servicio == null)
            throw new Exception("El servicio no existe.");

        for (int intento = 0; intento < 3; intento++)
        {
            var ahora = DateTime.Now;
            var fecha = ahora.Date;

            int ultimo = await _turnos.ObtenerUltimoNumeroAsync(
                servicioId, fecha);

            var turno = new Turno
            {
                ServicioId = servicioId,
                Numero = $"{servicio.Prefijo}-{ultimo + 1:D3}",
                NombreCliente = nombreCliente,
                FechaCreacion = ahora,
                Estado = "Esperando"
            };

            try
            {
                return await _turnos.CrearAsync(turno);
            }
            catch (NumeroTurnoDuplicadoException)
            {
                if (intento == 2)
                    throw new Exception(
                        "No se pudo generar el turno. Intente nuevamente.");
            }
        }

        throw new Exception("No se pudo generar el turno.");
    }

    public async Task<List<Turno>> ObtenerEnEsperaAsync(int servicioId)
    {
        return await _turnos.ObtenerEnEsperaAsync(servicioId);
    }

    public async Task<Turno?> ObtenerActualAsync(int servicioId)
    {
        return await _turnos.ObtenerEnAtencionAsync(servicioId);
    }

    public async Task<Turno> LlamarSiguienteAsync(int servicioId)
    {
        var actual = await _turnos.ObtenerEnAtencionAsync(servicioId);

        if (actual != null)
            throw new Exception(
                "Finalice la atención actual antes de llamar al siguiente.");

        var espera = await _turnos.ObtenerEnEsperaAsync(servicioId);

        var siguiente = espera
            .OrderBy(t => t.FechaCreacion)
            .ThenBy(t => t.Id)
            .FirstOrDefault();

        if (siguiente == null)
            throw new Exception("No hay turnos en espera.");

        siguiente.Estado = "En atención";
        await _turnos.ActualizarAsync(siguiente);

        return siguiente;
    }

    public async Task FinalizarAsync(int turnoId)
    {
        var turno = await _turnos.ObtenerPorIdAsync(turnoId);

        if (turno == null)
            throw new Exception("El turno no existe.");

        if (turno.Estado != "En atención")
            throw new Exception(
                "Solo se puede finalizar un turno en atención.");

        turno.Estado = "Atendido";
        await _turnos.ActualizarAsync(turno);
    }

    public async Task CancelarAsync(int turnoId)
    {
        var turno = await _turnos.ObtenerPorIdAsync(turnoId);

        if (turno == null)
            throw new Exception("El turno no existe.");

        if (turno.Estado != "Esperando")
            throw new Exception(
                "Solo se pueden cancelar turnos en espera.");

        turno.Estado = "Cancelado";
        await _turnos.ActualizarAsync(turno);
    }
}
