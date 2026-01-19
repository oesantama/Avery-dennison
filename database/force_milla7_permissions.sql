
-- Forzar permisos explícitos a nivel de usuario para milla7
DO $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM usuarios WHERE username = 'milla7';
    
    IF v_user_id IS NOT NULL THEN
        -- Borrar previos
        DELETE FROM permisos_usuario WHERE usuario_id = v_user_id;

        -- Insertar explícitos para TODAS las páginas
        INSERT INTO permisos_usuario (usuario_id, page_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
        SELECT 
            v_user_id,
            id,
            TRUE, TRUE, TRUE, TRUE
        FROM pages;
        
        RAISE NOTICE 'Permisos explícitos asignados a usuario milla7';
    ELSE
        RAISE NOTICE 'Usuario milla7 no encontrado';
    END IF;
END $$;
