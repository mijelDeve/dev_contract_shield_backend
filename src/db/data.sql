-- Usuarios de prueba (password_hash simulado con bcrypt placeholder)
INSERT INTO users (username, email, password_hash, full_name, wallet_address, is_client, is_developer, profile_picture_url, bio, is_verified, token_balance) VALUES
('juan_perez',    'juan@cliente.com',    'bcrypt$2b$12$fakehash1234567890', 'Juan Pérez López',    '0x1a2b3c4d5e6f7890abcdef1234567890', TRUE,  FALSE, 'https://i.pravatar.cc/150?img=1',  'Cliente que contrata desarrollo web y apps móviles.', TRUE,  0.00),
('ana_dev',       'ana@desarrolladora.pe','bcrypt$2b$12$fakehash0987654321', 'Ana María Gómez',     '0xabcdef1234567890fedcba0987654321', FALSE, TRUE,  'https://i.pravatar.cc/150?img=68', 'Desarrolladora Full-Stack (React, Node, Python). Especialista en blockchain.', TRUE,  45.75),
('carlos_mix',    'carlos@mixto.com',     'bcrypt$2b$12$fakehashabcdefghi', 'Carlos Ramírez',      '0x9876543210fedcba9876543210fedc',   TRUE,  TRUE,  'https://i.pravatar.cc/150?img=12', 'Cliente y desarrollador freelance. Me gusta probar nuevas tecnologías.', FALSE, 12.30),
('maria_cliente', 'maria@empresa.com',    'bcrypt$2b$12$fakehashjklmnopqr', 'María Torres Vargas', '0x111222333444555666777888999aaa',   TRUE,  FALSE, NULL,                               'Gerente de proyectos en startup fintech.', TRUE,  0.00),
('pedro_dev',     'pedro@freelance.pe',   'bcrypt$2b$12$fakehashstuvwxyz12', 'Pedro Castillo Ruiz', '0xaaaabbbbccccddddeeeeffff000011',   FALSE, TRUE,  'https://i.pravatar.cc/150?img=45', 'Especialista en Solidity y GenLayer. Buscando proyectos innovadores.', FALSE, 120.50);


-- Contratos de prueba
-- Nota: Ajusta los IDs de status según lo que insertaste en las tablas maestras
-- (puedes usar subqueries para obtener los IDs reales por código)

INSERT INTO contracts (
    title, 
    description, 
    amount, 
    start_date, 
    due_date, 
    zip_file_path, 
    github_repo_url, 
    is_github_project, 
    system_status_id, 
    genlayer_status_id, 
    creator_id, 
    developer_id
) VALUES
-- Contrato 1: En testing (recién entregado)
('App de delivery local', 
 'Desarrollar una app móvil simple para delivery de comida en Lima Norte usando React Native y Firebase.', 
 800.00, 
 '2025-12-01', 
 '2026-01-15', 
 NULL, 
 'https://github.com/ana-dev/delivery-app-lima', 
 TRUE, 
 (SELECT id FROM contract_system_statuses WHERE code = 'testing'), 
 (SELECT id FROM genlayer_transaction_statuses WHERE code = 'PENDING'), 
 (SELECT id FROM users WHERE username = 'juan_perez'), 
 (SELECT id FROM users WHERE username = 'ana_dev')),

-- Contrato 2: Aprobado y finalizado
('Landing page corporativa', 
 'Crear landing page moderna con Next.js, Tailwind y animaciones GSAP para empresa de consultoría.', 
 450.00, 
 '2025-11-10', 
 '2025-12-05', 
 NULL, 
 'https://github.com/pedro-dev/landing-consultora', 
 TRUE, 
 (SELECT id FROM contract_system_statuses WHERE code = 'finalized'), 
 (SELECT id FROM genlayer_transaction_statuses WHERE code = 'FINALIZED'), 
 (SELECT id FROM users WHERE username = 'maria_cliente'), 
 (SELECT id FROM users WHERE username = 'pedro_dev')),

-- Contrato 3: En apelación
('Integración GenLayer en dApp', 
 'Implementar Intelligent Contract básico en GenLayer para resolución automática de disputas en freelance.', 
 2500.00, 
 '2026-01-05', 
 '2026-03-20', 
 's3://buckets/projects/contract-3.zip', 
 NULL, 
 FALSE, 
 (SELECT id FROM contract_system_statuses WHERE code = 'appealed'), 
 (SELECT id FROM genlayer_transaction_statuses WHERE code = 'ACCEPTED'), 
 (SELECT id FROM users WHERE username = 'carlos_mix'), 
 (SELECT id FROM users WHERE username = 'ana_dev')),

-- Contrato 4: Rechazado (sin apelación)
('Bot de Telegram para soporte', 
 'Bot simple para atención al cliente 24/7 usando Telegraf y Node.js.', 
 300.00, 
 '2026-02-01', 
 '2026-02-28', 
 NULL, 
 'https://github.com/dev-bot/telegram-support-bot', 
 TRUE, 
 (SELECT id FROM contract_system_statuses WHERE code = 'rejected'), 
 (SELECT id FROM genlayer_transaction_statuses WHERE code = 'FINALIZED'), 
 (SELECT id FROM users WHERE username = 'juan_perez'), 
 (SELECT id FROM users WHERE username = 'pedro_dev')),

-- Contrato 5: Recién creado (sin desarrollador asignado aún)
('Dashboard administrativo SaaS', 
 'Dashboard con gráficos, usuarios y reportes para SaaS de gestión de inventarios.', 
 1800.00, 
 '2026-03-01', 
 '2026-05-30', 
 NULL, 
 NULL, 
 FALSE, 
 (SELECT id FROM contract_system_statuses WHERE code = 'created'), 
 NULL, 
 (SELECT id FROM users WHERE username = 'maria_cliente'), 
 NULL);
