
using SistemaTurnos.Domain.Models;

namespace SistemaTurnos.Application.Interfaces;

public interface IServicioRepository
{
    Task<List<Servicio>> ObtenerTodosAsync();
    Task<Servicio?> ObtenerPorIdAsync(int id);
    Task<Servicio?> ObtenerPorPrefijoAsync(string prefijo);
    Task<int> CrearAsync(Servicio servicio);
}
