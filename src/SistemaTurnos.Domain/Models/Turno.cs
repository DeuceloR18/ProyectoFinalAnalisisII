
namespace SistemaTurnos.Domain.Models;

public class Turno
{
    public int Id { get; set; }
    public int ServicioId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? NombreCliente { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string Estado { get; set; } = "Esperando";
}
