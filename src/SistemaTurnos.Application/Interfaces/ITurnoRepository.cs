
using SistemaTurnos.Domain.Models;

namespace SistemaTurnos.Application.Interfaces;

public interface ITurnoRepository
{
    Task<List<Turno>> ObtenerEnEsperaAsync(int servicioId);
    Task<Turno?> ObtenerPorIdAsync(int id);
    Task<Turno?> ObtenerEnAtencionAsync(int servicioId);
    Task<int> ObtenerUltimoNumeroAsync(int servicioId, DateTime fecha);
    Task<int> CrearAsync(Turno turno);
    Task ActualizarAsync(Turno turno);
}
