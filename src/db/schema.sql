-- =============================================
-- 1. Tabla maestra: Estados del sistema (tus 10 estados)
-- =============================================
CREATE TABLE contract_system_statuses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,          -- Ej: 'created', 'submitted', etc.
    name_es     VARCHAR(100) NOT NULL,                -- Nombre en español
    name_en     VARCHAR(100) NOT NULL,                -- Nombre en inglés
    description TEXT,                                 -- Descripción breve
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar los 10 estados del sistema
INSERT INTO contract_system_statuses (code, name_es, name_en, description) VALUES
('created',         'Creado',               'Created',              'Cliente inicia el acuerdo/escrow.'),
('submitted',       'Entregado',            'Submitted',            'Desarrollador sube el código/proyecto.'),
('testing',         'Ejecutando Tests',     'Testing',              'Sistema corre los unit tests y genera reporte.'),
('tests_completed', 'Tests Finalizados',     'Tests Completed',      'Reporte de tests listo (pass/fail, evidencias).'),
('report_submitted','Reporte Enviado',       'Report Submitted',     'Reporte subido al Intelligent Contract en GenLayer.'),
('under_review',    'En Revisión',           'Under Review',         'GenLayer procesando (validadores votando).'),
('approved',        'Aprobado',              'Approved',             'Veredicto favorable al desarrollador → liberar pago.'),
('rejected',        'Rechazado',             'Rejected',             'Veredicto desfavorable → devolver fondos al cliente o aplicar penalidad.'),
('appealed',        'En Apelación',          'Appealed',             'Alguna parte apela el veredicto inicial.'),
('finalized',       'Finalizado',            'Finalized',            'Decisión definitiva (sin más apelaciones o apelaciones resueltas).');

-- =============================================
-- 2. Tabla maestra: Estados de GenLayer (TransactionStatus)
-- =============================================
CREATE TABLE genlayer_transaction_statuses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50) UNIQUE NOT NULL,          -- Ej: 'PENDING', 'ACCEPTED', etc.
    name        VARCHAR(100) NOT NULL,                -- Nombre en mayúsculas como en el enum
    description TEXT,                                 -- Descripción breve
    phase       TEXT,                                 -- Fase en el flujo
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar los estados de GenLayer
INSERT INTO genlayer_transaction_statuses (code, name, description, phase) VALUES
('PENDING',     'PENDING',      'Transacción recién enviada/submitida. En cola esperando procesamiento.',       'Inicio: recibida por la red, en queue por cuenta.'),
('CANCELED',    'CANCELED',     'Transacción cancelada manualmente por el usuario o por timeout/error.',         'Fin prematuro (usuario cancela o fees insuficientes sin top-up).'),
('PROPOSING',   'PROPOSING',    'Líder (validator) seleccionado y proponiendo el resultado (ejecuta LLM).',      'Fase de propuesta inicial.'),
('COMMITTING',  'COMMITTING',   'Validadores cometen sus votos y estimaciones de costo (commit phase).',         'Compromiso de votos para evitar colusión.'),
('REVEALING',   'REVEALING',    'Validadores revelan sus votos/computaciones (reveal phase).',                    'Revelación para determinar acuerdo mayoritario.'),
('ACCEPTED',    'ACCEPTED',     'Mayoría acuerda → veredicto provisional (tentative). Entra Finality Window.',     'Veredicto inicial aceptado (optimistic). Se puede apelar aquí.'),
('FINALIZED',   'FINALIZED',    'Decisión irreversible: pasó Finality Window sin apelación o apelación resuelta.', 'Finality completa → estado del contrato actualizado permanentemente.'),
('UNDETERMINED','UNDETERMINED', 'No se alcanzó consenso (después de rounds). Puede volver a proposing o finalizar sin cambio.', 'Caso raro: falta acuerdo → a menudo finaliza igual tras window.');

-- =============================================
-- 3. Tabla: Usuarios
-- =============================================
CREATE TABLE users (
    id                  SERIAL PRIMARY KEY,
    username            VARCHAR(50) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(100),
    wallet_address      VARCHAR(42),                              -- Para GenLayer / EVM
    is_client           BOOLEAN DEFAULT TRUE,
    is_developer        BOOLEAN DEFAULT FALSE,
    profile_picture_url VARCHAR(512),
    bio                 TEXT,
    is_verified         BOOLEAN DEFAULT FALSE,
    token_balance       DECIMAL(18, 8) DEFAULT 0,                -- Saldo en tokens GenLayer (para bonds)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. Tabla: Contratos (principal)
-- =============================================
CREATE TABLE contracts (
    id                      SERIAL PRIMARY KEY,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    amount                  DECIMAL(18, 2) NOT NULL,             -- Monto en escrow
    start_date              DATE NOT NULL,
    due_date                DATE NOT NULL,
    zip_file_path           VARCHAR(512),
    github_repo_url         VARCHAR(512),
    is_github_project       BOOLEAN DEFAULT FALSE,
    
    -- Estados (referenciamos las tablas maestras)
    system_status_id        INTEGER NOT NULL REFERENCES contract_system_statuses(id) DEFAULT 1,  -- Por defecto: created
    genlayer_status_id      INTEGER REFERENCES genlayer_transaction_statuses(id),                -- Puede ser NULL al inicio
    
    creator_id              INTEGER NOT NULL REFERENCES users(id),       -- Cliente que crea
    developer_id            INTEGER REFERENCES users(id),                -- Desarrollador asignado (puede ser NULL hasta asignar)
    
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX idx_contracts_creator ON contracts(creator_id);
CREATE INDEX idx_contracts_developer ON contracts(developer_id);
CREATE INDEX idx_contracts_system_status ON contracts(system_status_id);
CREATE INDEX idx_contracts_genlayer_status ON contracts(genlayer_status_id);
