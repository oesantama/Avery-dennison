
from sqlalchemy import inspect
from app.database import engine

def inspect_db():
    inspector = inspect(engine)
    print("Tablas en la base de datos:")
    for table_name in inspector.get_table_names():
        print(f" - {table_name}")

if __name__ == "__main__":
    inspect_db()
