"""
✅ MEJORA: Utilidades de paginación para endpoints
"""
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query
from fastapi import Query as FastAPIQuery

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Parámetros de paginación"""
    skip: int = Field(0, ge=0, description="Número de registros a omitir")
    limit: int = Field(50, ge=1, le=100, description="Número máximo de registros a retornar")
    sort_by: Optional[str] = Field(None, description="Campo por el cual ordenar")
    sort_order: Optional[str] = Field("asc", description="Orden: asc o desc")


class PageResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica"""
    items: List[T] = Field(..., description="Lista de items de la página actual")
    total: int = Field(..., description="Total de registros disponibles")
    page: int = Field(..., description="Número de página actual (empezando en 1)")
    page_size: int = Field(..., description="Tamaño de la página")
    total_pages: int = Field(..., description="Total de páginas disponibles")
    has_next: bool = Field(..., description="Si existe una página siguiente")
    has_previous: bool = Field(..., description="Si existe una página anterior")

    class Config:
        from_attributes = True


def paginate_query(
    query: Query,
    skip: int = 0,
    limit: int = 50,
    sort_by: Optional[str] = None,
    sort_order: str = "asc"
) -> tuple[List, int]:
    """
    Aplica paginación a una query de SQLAlchemy

    Args:
        query: Query de SQLAlchemy
        skip: Número de registros a omitir
        limit: Número máximo de registros a retornar
        sort_by: Campo por el cual ordenar (opcional)
        sort_order: Orden ascendente (asc) o descendente (desc)

    Returns:
        Tuple con (items, total_count)
    """
    # Validar parámetros
    if skip < 0:
        skip = 0
    if limit < 1:
        limit = 50
    if limit > 100:
        limit = 100

    # Obtener total de registros
    total = query.count()

    # Aplicar ordenamiento si se especifica
    if sort_by:
        # Validar sort_order
        if sort_order.lower() not in ['asc', 'desc']:
            sort_order = 'asc'

        # Intentar aplicar ordenamiento
        try:
            model = query.column_descriptions[0]['entity']
            if hasattr(model, sort_by):
                order_column = getattr(model, sort_by)
                if sort_order.lower() == 'desc':
                    query = query.order_by(order_column.desc())
                else:
                    query = query.order_by(order_column.asc())
        except (IndexError, AttributeError, KeyError):
            # Si falla el ordenamiento, continuar sin él
            pass

    # Aplicar paginación
    items = query.offset(skip).limit(limit).all()

    return items, total


def create_page_response(
    items: List[T],
    total: int,
    skip: int,
    limit: int
) -> PageResponse[T]:
    """
    Crea una respuesta paginada

    Args:
        items: Lista de items de la página actual
        total: Total de registros disponibles
        skip: Número de registros omitidos
        limit: Número máximo de registros por página

    Returns:
        PageResponse con metadata de paginación
    """
    page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return PageResponse(
        items=items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
        has_next=skip + limit < total,
        has_previous=skip > 0
    )


def get_pagination_params(
    skip: int = FastAPIQuery(0, ge=0, description="Registros a omitir"),
    limit: int = FastAPIQuery(50, ge=1, le=100, description="Registros por página"),
    sort_by: Optional[str] = FastAPIQuery(None, description="Campo de ordenamiento"),
    sort_order: str = FastAPIQuery("asc", regex="^(asc|desc)$", description="Orden: asc o desc")
) -> dict:
    """
    Dependency para obtener parámetros de paginación

    Uso en endpoint:
        @router.get("/items")
        async def list_items(
            pagination: dict = Depends(get_pagination_params),
            db: Session = Depends(get_db)
        ):
            query = db.query(Item)
            items, total = paginate_query(query, **pagination)
            return create_page_response(items, total, pagination['skip'], pagination['limit'])
    """
    return {
        'skip': skip,
        'limit': limit,
        'sort_by': sort_by,
        'sort_order': sort_order
    }


# Ejemplo de uso en un endpoint
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse
from app.utils.pagination import get_pagination_params, paginate_query, create_page_response

router = APIRouter()

@router.get("/usuarios", response_model=PageResponse[UsuarioResponse])
async def list_usuarios(
    pagination: dict = Depends(get_pagination_params),
    db: Session = Depends(get_db)
):
    query = db.query(Usuario).filter(Usuario.activo == True)
    items, total = paginate_query(query, **pagination)
    return create_page_response(items, total, pagination['skip'], pagination['limit'])
"""
