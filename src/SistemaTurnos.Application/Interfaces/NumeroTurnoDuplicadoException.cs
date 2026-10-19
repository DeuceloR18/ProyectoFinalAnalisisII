
namespace SistemaTurnos.Application.Interfaces;

public class NumeroTurnoDuplicadoException : Exception
{
    public NumeroTurnoDuplicadoException()
        : base("El número de turno ya existe.")
    {
    }
}
