
using Dapper;
using SistemaTurnos.Application.Interfaces;
using SistemaTurnos.Domain.Models;
using SistemaTurnos.Infrastructure.Data;

namespace SistemaTurnos.Infrastructure.Repositories;

public class ServicioRepository : IServicioRepository
{
    private readonly DbConnectionFactory _db;

    public ServicioRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<Servicio>> ObtenerTodosAsync()
    {
        using var conexion = _db.CrearConexion();

        var resultado = await conexion.QueryAsync<Servicio>(
            "SELECT Id, Nombre, Prefijo FROM Servicios ORDER BY Id");

        return resultado.ToList();
    }

    public async Task<Servicio?> ObtenerPorIdAsync(int id)
    {
        using var conexion = _db.CrearConexion();

        return await conexion.QueryFirstOrDefaultAsync<Servicio>(
            "SELECT Id, Nombre, Prefijo FROM Servicios WHERE Id = @Id",
            new { Id = id });
    }

    public async Task<Servicio?> ObtenerPorPrefijoAsync(string prefijo)
    {
        using var conexion = _db.CrearConexion();

        return await conexion.QueryFirstOrDefaultAsync<Servicio>(
            "SELECT Id, Nombre, Prefijo FROM Servicios WHERE Prefijo = @Prefijo",
            new { Prefijo = prefijo });
    }

    public async Task<int> CrearAsync(Servicio servicio)
    {
        using var conexion = _db.CrearConexion();

        string sql = @"
            INSERT INTO Servicios (Nombre, Prefijo)
            OUTPUT INSERTED.Id
            VALUES (@Nombre, @Prefijo)";

        return await conexion.ExecuteScalarAsync<int>(sql, servicio);
    }
}
