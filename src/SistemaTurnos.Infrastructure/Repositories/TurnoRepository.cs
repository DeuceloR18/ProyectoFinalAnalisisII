
using Dapper;
using Microsoft.Data.SqlClient;
using SistemaTurnos.Application.Interfaces;
using SistemaTurnos.Domain.Models;
using SistemaTurnos.Infrastructure.Data;

namespace SistemaTurnos.Infrastructure.Repositories;

public class TurnoRepository : ITurnoRepository
{
    private readonly DbConnectionFactory _db;

    public TurnoRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<Turno>> ObtenerEnEsperaAsync(int servicioId)
    {
        using var conexion = _db.CrearConexion();

        var resultado = await conexion.QueryAsync<Turno>(
            @"SELECT * FROM Turnos
              WHERE ServicioId = @ServicioId
              AND Estado = 'Esperando'
              ORDER BY FechaCreacion, Id",
            new { ServicioId = servicioId });

        return resultado.ToList();
    }

    public async Task<Turno?> ObtenerPorIdAsync(int id)
    {
        using var conexion = _db.CrearConexion();

        return await conexion.QueryFirstOrDefaultAsync<Turno>(
            "SELECT * FROM Turnos WHERE Id = @Id",
            new { Id = id });
    }

    public async Task<Turno?> ObtenerEnAtencionAsync(int servicioId)
    {
        using var conexion = _db.CrearConexion();

        return await conexion.QueryFirstOrDefaultAsync<Turno>(
            @"SELECT * FROM Turnos
              WHERE ServicioId = @ServicioId
              AND Estado = @Estado",
            new
            {
                ServicioId = servicioId,
                Estado = "En atención"
            });
    }

    public async Task<int> ObtenerUltimoNumeroAsync(
        int servicioId, DateTime fecha)
    {
        using var conexion = _db.CrearConexion();

        return await conexion.ExecuteScalarAsync<int>(
            @"SELECT ISNULL(MAX(TRY_CONVERT(INT,
              SUBSTRING(Numero, CHARINDEX('-', Numero) + 1, 20))), 0)
              FROM Turnos
              WHERE ServicioId = @ServicioId
              AND FechaCreacion >= @Fecha
              AND FechaCreacion < DATEADD(day, 1, @Fecha)",
            new
            {
                ServicioId = servicioId,
                Fecha = fecha.Date
            });
    }

    public async Task<int> CrearAsync(Turno turno)
    {
        using var conexion = _db.CrearConexion();

        string sql = @"
            INSERT INTO Turnos
            (ServicioId, Numero, NombreCliente, FechaCreacion, Estado)
            OUTPUT INSERTED.Id
            VALUES
            (@ServicioId, @Numero, @NombreCliente, @FechaCreacion, @Estado)";

        try
        {
            return await conexion.ExecuteScalarAsync<int>(sql, turno);
        }
        catch (SqlException ex)
            when (ex.Number == 2601 || ex.Number == 2627)
        {
            throw new NumeroTurnoDuplicadoException();
        }
    }

    public async Task ActualizarAsync(Turno turno)
    {
        using var conexion = _db.CrearConexion();

        await conexion.ExecuteAsync(
            "UPDATE Turnos SET Estado = @Estado WHERE Id = @Id",
            turno);
    }
}
