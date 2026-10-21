
using Microsoft.AspNetCore.Mvc;
using SistemaTurnos.Application.Services;
using SistemaTurnos.Domain.Models;

namespace SistemaTurnos.Web.Controllers;

[ApiController]
[Route("api/servicios")]
public class ServiciosController : ControllerBase
{
    private readonly ServicioService _servicioService;

    public ServiciosController(ServicioService servicioService)
    {
        _servicioService = servicioService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerTodos()
    {
        var servicios = await _servicioService.ObtenerTodosAsync();
        return Ok(servicios);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(Servicio servicio)
    {
        try
        {
            int id = await _servicioService.CrearAsync(servicio);
            return Ok(new { Id = id, Mensaje = "Servicio registrado correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Mensaje = ex.Message });
        }
    }
}
