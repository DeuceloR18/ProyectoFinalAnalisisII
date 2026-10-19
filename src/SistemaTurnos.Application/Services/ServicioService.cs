
using SistemaTurnos.Application.Interfaces;
using SistemaTurnos.Domain.Models;

namespace SistemaTurnos.Application.Services;

public class ServicioService
{
    private readonly IServicioRepository _repository;

    public ServicioService(IServicioRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Servicio>> ObtenerTodosAsync()
    {
        return await _repository.ObtenerTodosAsync();
    }

    public async Task<int> CrearAsync(Servicio servicio)
    {
        if (string.IsNullOrWhiteSpace(servicio.Nombre))
            throw new Exception("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(servicio.Prefijo))
            throw new Exception("El prefijo es obligatorio.");

        servicio.Nombre = servicio.Nombre.Trim();
        servicio.Prefijo = servicio.Prefijo.Trim().ToUpperInvariant();

        var existente = await _repository.ObtenerPorPrefijoAsync(servicio.Prefijo);

        if (existente != null)
            throw new Exception("Este prefijo ya está registrado.");

        return await _repository.CrearAsync(servicio);
    }
}
