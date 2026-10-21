
using SistemaTurnos.Application.Interfaces;
using SistemaTurnos.Application.Services;
using SistemaTurnos.Infrastructure.Data;
using SistemaTurnos.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Configurar la conexión con SQL Server
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "No se encontró la conexión a la base de datos.");

builder.Services.AddSingleton(
    new DbConnectionFactory(connectionString));

// Registrar los repositorios
builder.Services.AddScoped<IServicioRepository, ServicioRepository>();
builder.Services.AddScoped<ITurnoRepository, TurnoRepository>();

// Registrar los servicios
builder.Services.AddScoped<ServicioService>();
builder.Services.AddScoped<TurnoService>();

// Configurar los controladores
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configurar la aplicación
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();


app.Run();