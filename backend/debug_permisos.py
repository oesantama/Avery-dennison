"""
Script de diagnóstico para verificar permisos del usuario admin
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Usuario, Rol, Page, PermisosRol, PermisosUsuario
from app.services.authorization import AuthorizationService

def debug_admin_permissions():
    """Diagnostica los permisos del usuario admin"""
    db: Session = SessionLocal()

    try:
        print("=" * 70)
        print("DIAGNÓSTICO DE PERMISOS - USUARIO ADMIN")
        print("=" * 70)

        # 1. Verificar que el usuario admin existe
        print("\n1️⃣ Verificando usuario admin...")
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()

        if not admin:
            print("❌ ERROR: Usuario 'admin' no existe en la base de datos")
            return

        print(f"✅ Usuario encontrado:")
        print(f"   - ID: {admin.id}")
        print(f"   - Username: {admin.username}")
        print(f"   - Activo: {admin.activo}")
        print(f"   - Rol ID: {admin.rol_id}")

        # 2. Verificar el rol del admin
        print("\n2️⃣ Verificando rol del admin...")
        if not admin.rol_id:
            print("❌ ERROR: Usuario admin no tiene rol asignado (rol_id es NULL)")
            return

        rol = db.query(Rol).filter(Rol.id == admin.rol_id).first()
        if not rol:
            print(f"❌ ERROR: El rol con ID {admin.rol_id} no existe")
            return

        print(f"✅ Rol encontrado:")
        print(f"   - ID: {rol.id}")
        print(f"   - Nombre: {rol.nombre}")
        print(f"   - Activo: {rol.activo}")

        # 3. Verificar si es_admin() funciona
        print("\n3️⃣ Verificando función es_admin()...")
        es_admin = AuthorizationService.es_admin(db, admin.id)
        print(f"   - AuthorizationService.es_admin(db, {admin.id}): {es_admin}")

        if not es_admin:
            print(f"❌ ERROR: es_admin() retorna False")
            print(f"   El rol debe llamarse exactamente 'Administrador'")
            print(f"   Rol actual: '{rol.nombre}'")
            return

        print("✅ es_admin() retorna True correctamente")

        # 4. Verificar páginas activas en la BD
        print("\n4️⃣ Verificando páginas activas...")
        pages = db.query(Page).filter(Page.activo == True).all()
        print(f"✅ Páginas activas encontradas: {len(pages)}")
        for page in pages:
            print(f"   - {page.nombre}: {page.ruta}")

        # 5. Verificar permisos del rol en permisos_rol
        print("\n5️⃣ Verificando permisos del rol en tabla permisos_rol...")
        permisos_rol = db.query(PermisosRol).filter(
            PermisosRol.rol_id == admin.rol_id
        ).all()
        print(f"   Permisos del rol encontrados: {len(permisos_rol)}")

        if permisos_rol:
            print("   Permisos del rol:")
            for p in permisos_rol[:5]:  # Mostrar solo los primeros 5
                page = db.query(Page).filter(Page.id == p.page_id).first()
                if page:
                    print(f"   - {page.ruta}: ver={p.puede_ver}, crear={p.puede_crear}, editar={p.puede_editar}, eliminar={p.puede_eliminar}")
            if len(permisos_rol) > 5:
                print(f"   ... y {len(permisos_rol) - 5} más")
        else:
            print("⚠️  ADVERTENCIA: El rol no tiene permisos en permisos_rol")

        # 6. Verificar permisos especiales del usuario
        print("\n6️⃣ Verificando permisos especiales del usuario...")
        permisos_usuario = db.query(PermisosUsuario).filter(
            PermisosUsuario.usuario_id == admin.id
        ).all()
        print(f"   Permisos especiales: {len(permisos_usuario)}")
        if permisos_usuario:
            for p in permisos_usuario[:5]:
                page = db.query(Page).filter(Page.id == p.page_id).first()
                if page:
                    print(f"   - {page.ruta}: ver={p.puede_ver}, crear={p.puede_crear}, editar={p.puede_editar}, eliminar={p.puede_eliminar}")

        # 7. Simular el endpoint /my-permissions
        print("\n7️⃣ Simulando endpoint /my-permissions...")

        if AuthorizationService.es_admin(db, admin.id):
            print("✅ Usuario es admin, debería retornar TODAS las páginas")
            all_pages = db.query(Page).filter(Page.activo == True).all()
            permisos_detallados = {}
            for page in all_pages:
                permisos_detallados[page.ruta] = {
                    "puede_ver": True,
                    "puede_crear": True,
                    "puede_editar": True,
                    "puede_borrar": True
                }

            print(f"\n📋 RESULTADO ESPERADO:")
            print(f"   Total de páginas: {len(permisos_detallados)}")
            print(f"   Páginas:")
            for ruta in sorted(permisos_detallados.keys()):
                print(f"      - {ruta}")
        else:
            print("❌ Usuario NO es admin, consultando permisos del rol...")

        print("\n" + "=" * 70)
        print("DIAGNÓSTICO COMPLETADO")
        print("=" * 70)

    except Exception as e:
        print(f"\n❌ ERROR DURANTE EL DIAGNÓSTICO:")
        print(f"   {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    debug_admin_permissions()
