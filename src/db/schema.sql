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

-- ============================================================                                                                                       
-- 3. Tabla: contracts                            
-- ============================================================                                                                                       
  CREATE TABLE contracts (                                                                                                                              
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                       
    contract_id       VARCHAR(66),                                                                                                                      
    title             VARCHAR(255) NOT NULL,                        
    description       TEXT,
    acceptance_rule   TEXT NOT NULL,
    amount            DECIMAL(18, 2) NOT NULL,                                                                                                          
    currency          VARCHAR(10) NOT NULL DEFAULT 'GEN',
    language_stack    VARCHAR(100) NOT NULL,                                                                                                            
    start_date        TIMESTAMPTZ,                                  
    due_date          TIMESTAMPTZ,                                                                                                                      
    zip_file_path     TEXT,                                                                                                                             
    github_repo_url   VARCHAR(512),
    is_github_project BOOLEAN NOT NULL DEFAULT false,                                                                                                   
    status            VARCHAR(50) NOT NULL DEFAULT 'draft',         
    genlayer_status   VARCHAR(50) NOT NULL DEFAULT 'Created',                                                                                           
    client_id         UUID REFERENCES users(id) ON DELETE SET NULL,                                                                                     
    developer_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),                                                                                               
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()            
  );                                                                                                                                                    
                                                                    
  CREATE UNIQUE INDEX idx_contracts_contract_id ON contracts(contract_id) WHERE contract_id IS NOT NULL;                                                
  CREATE INDEX idx_contracts_client_id          ON contracts(client_id);
  CREATE INDEX idx_contracts_developer_id       ON contracts(developer_id);                                                                             
  CREATE INDEX idx_contracts_status             ON contracts(status);                                                                                   
  CREATE INDEX idx_contracts_genlayer_status    ON contracts(genlayer_status);
  CREATE INDEX idx_contracts_created_at         ON contracts(created_at DESC);                                                                          
                                                                                                                                                        
-- ============================================================                                                                                       
-- 4. Tabla: adjudications                                                                                                                              
-- ============================================================                                                                                       
  CREATE TABLE adjudications (                                      
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id       VARCHAR(66) NOT NULL,
    verdict           VARCHAR(20) NOT NULL,
    reason            TEXT,                                                                                                                             
    layer_a_pass_rate DECIMAL(5, 4),
    layer_c_status    VARCHAR(20),                                                                                                                      
    rule_applied      TEXT,                                         
    evidence_raw      JSONB,                                                                                                                            
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()            
  );                                                                                                                                                    
   
  CREATE INDEX idx_adjudications_contract_id ON adjudications(contract_id);                                                                             
  CREATE INDEX idx_adjudications_verdict     ON adjudications(verdict);
  CREATE INDEX idx_adjudications_created_at  ON adjudications(created_at DESC); 




ALTER TABLE contracts
ADD COLUMN coverage INTEGER 
    DEFAULT 0 
    CHECK (coverage >= 0 AND coverage <= 100);