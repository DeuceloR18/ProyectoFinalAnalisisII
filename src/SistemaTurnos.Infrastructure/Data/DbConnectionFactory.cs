
using Microsoft.Data.SqlClient;

namespace SistemaTurnos.Infrastructure.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public SqlConnection CrearConexion()
    {
        return new SqlConnection(_connectionString);
    }
}
