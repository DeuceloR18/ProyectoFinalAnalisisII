
-- SISTEMA DE ADMINISTRACION DE TURNOS
-- Script para instalar la base de datos

IF DB_ID(N'SistemaTurnosDB') IS NULL
BEGIN
    CREATE DATABASE SistemaTurnosDB;
END
GO

USE SistemaTurnosDB;
GO

-- Tabla de servicios
IF OBJECT_ID(N'dbo.Servicios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Servicios
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Prefijo NVARCHAR(10) NOT NULL UNIQUE
    );
END
GO

-- Tabla de turnos
IF OBJECT_ID(N'dbo.Turnos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Turnos
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ServicioId INT NOT NULL,
        Numero NVARCHAR(20) NOT NULL,
        NombreCliente NVARCHAR(100) NULL,
        FechaCreacion DATETIME2 NOT NULL
            DEFAULT SYSDATETIME(),
        Estado NVARCHAR(20) NOT NULL
            DEFAULT N'Esperando',

        CONSTRAINT FK_Turnos_Servicios
            FOREIGN KEY (ServicioId)
            REFERENCES dbo.Servicios(Id),

        CONSTRAINT CK_Turnos_Estado
            CHECK (Estado IN (
                N'Esperando',
                N'En atención',
                N'Atendido',
                N'Cancelado'
            ))
    );
END
GO

-- Columna que identifica el día del turno
IF COL_LENGTH(N'dbo.Turnos', N'FechaDia') IS NULL
BEGIN
    ALTER TABLE dbo.Turnos
    ADD FechaDia AS
        CAST(FechaCreacion AS DATE) PERSISTED;
END
GO

-- Evitar números de turno duplicados por día
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Turnos_Numero_Dia'
      AND object_id = OBJECT_ID(N'dbo.Turnos')
)
BEGIN
    CREATE UNIQUE INDEX IX_Turnos_Numero_Dia
    ON dbo.Turnos (ServicioId, FechaDia, Numero);
END
GO

-- Verificar las tablas creadas
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME IN ('Servicios', 'Turnos');
GO
