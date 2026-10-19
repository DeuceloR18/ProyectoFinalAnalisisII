
using Microsoft.AspNetCore.Mvc;
using SistemaTurnos.Application.Services;

namespace SistemaTurnos.Web.Controllers;

[ApiController]
[Route("api/turnos")]
public class TurnosController : ControllerBase
{
    private readonly TurnoService _turnoService;

    public TurnosController(TurnoService turnoService)
    {
        _turnoService = turnoService;
    }

    // Generar un nuevo turno
    [HttpPost]
    public async Task<IActionResult> Crear(
        [FromBody] CrearTurnoRequest request)
    {
        try
        {
            int id = await _turnoService.CrearAsync(
                request.ServicioId,
                request.NombreCliente);

            return Ok(new
            {
                Id = id,
                Mensaje = "Turno generado correctamente."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Mensaje = ex.Message });
        }
    }

    // Consultar el turno actual
    [HttpGet("actual/{servicioId}")]
    public async Task<IActionResult> ObtenerActual(int servicioId)
    {
        var turno = await _turnoService.ObtenerActualAsync(servicioId);

        if (turno == null)
            return Ok(new
            {
                Mensaje = "No hay turno en atención."
            });

        return Ok(turno);
    }

    // Consultar la fila de espera
    [HttpGet("espera/{servicioId}")]
    public async Task<IActionResult> ObtenerEnEspera(int servicioId)
    {
        var turnos = await _turnoService.ObtenerEnEsperaAsync(servicioId);
        return Ok(turnos);
    }

    // Llamar al siguiente turno
    [HttpPost("siguiente/{servicioId}")]
    public async Task<IActionResult> LlamarSiguiente(int servicioId)
    {
        try
        {
            var turno = await _turnoService.LlamarSiguienteAsync(servicioId);
            return Ok(turno);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Mensaje = ex.Message });
        }
    }

    // Finalizar la atención
    [HttpPost("finalizar/{turnoId}")]
    public async Task<IActionResult> Finalizar(int turnoId)
    {
        try
        {
            await _turnoService.FinalizarAsync(turnoId);

            return Ok(new
            {
                Mensaje = "Atención finalizada correctamente."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Mensaje = ex.Message });
        }
    }

    // Cancelar un turno en espera
    [HttpPost("cancelar/{turnoId}")]
    public async Task<IActionResult> Cancelar(int turnoId)
    {
        try
        {
            await _turnoService.CancelarAsync(turnoId);

            return Ok(new
            {
                Mensaje = "Turno cancelado correctamente."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Mensaje = ex.Message });
        }
    }
}

// Datos necesarios para generar un turno
public class CrearTurnoRequest
{
    public int ServicioId { get; set; }
    public string? NombreCliente { get; set; }
}
