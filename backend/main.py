# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app import auth, crud, models, schemas
from app.database import get_db, engine
from fastapi.responses import PlainTextResponse
import chardet

# Импортируем Alembic
from alembic.config import Config
from alembic import command

# Автоматическое применение миграций при старте
def run_migrations():
    try:
        print("🔄 Проверка и применение миграций базы данных...")
        
        # Конфигурация Alembic
        alembic_cfg = Config("alembic.ini")
        
        # Применяем все миграции
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Миграции успешно применены")
    except Exception as e:
        print(f"⚠️  Ошибка при применении миграций: {e}")
        print("⚠️  Продолжаем работу без миграций...")

# Запускаем миграции при старте
run_migrations()

# Создаем таблицы если их нет (для совместимости)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Book Reader API",
    version="1.0.0",
    description="API для чтения и конспектирования книг"
)
# НАСТРОЙКА CORS - РАЗРЕШАЕМ ВСЕ ДОМЕНЫ ДЛЯ РАЗРАБОТКИ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ... остальной код без изменений (такой же как был)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ---------------------------
# Вспомогательная функция аутентификации
# ---------------------------
def authenticate_user(db: Session, username: str, password: str):
    user = crud.get_user_by_username(db, username)
    if not user:
        return None
    if not auth.verify_password(password, user.hashed_password):
        return None
    return user

# ---------------------------
# Регистрация
# ---------------------------
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    return crud.create_user(db, user.username, user.password)

# ---------------------------
# Вход (login)
# ---------------------------
@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

# ---------------------------
# Защищённый маршрут (токен)
# ---------------------------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = auth.decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username = payload["sub"]
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@app.get("/protected")
def protected_route(current_user: models.User = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.username}! This is a protected route."}

# ---------------------------
# Получение списка книг пользователя
# ---------------------------
@app.get("/books/", response_model=list[schemas.BookOut])
def get_user_books(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Здесь нужно добавить метод в crud.py для получения книг пользователя
    # Временно используем прямое обращение к БД
    books = db.query(models.Book).filter(models.Book.owner_id == current_user.id).all()
    return books

# ---------------------------
# Загрузка книги
# ---------------------------
@app.post("/books/upload", response_model=schemas.BookOut)
def upload_book_file(
    book_file: UploadFile = File(...),
    title: str = Form(...),
    author: str | None = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Читаем содержимое файла
    content = book_file.file.read()
    
    # Создаем книгу
    book = crud.create_book(db, title=title, author=author, content=content, owner_id=current_user.id)
    
    # Автоматически создаем сессию для этой книги
    session_name = f"Чтение: {title[:30]}{'...' if len(title) > 30 else ''}"
    session = crud.create_session(db, name=session_name, book_id=book.id, user_id=current_user.id)
    
    # Создаем первоначальный конспект
    summary_text = f"Книга '{title}'" + (f" от автора {author}" if author else "")
    summary = crud.create_summary(db, session_id=session.id, content=summary_text)
    
    return book
# ---------------------------
# Сессии
# ---------------------------
@app.post("/sessions/", response_model=dict)
def create_session(
    session: schemas.SessionCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Проверяем, принадлежит ли книга пользователю
    book = crud.get_book(db, session.book_id)
    if not book or book.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Book not found or access denied"
        )
    
    db_session = crud.create_session(db, session.name, session.book_id, current_user.id)
    return {"session_id": db_session.id, "name": db_session.name}

@app.get("/sessions/", response_model=list[dict])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.Session).filter(models.Session.user_id == current_user.id).all()
    return [{"id": s.id, "name": s.name, "book_id": s.book_id} for s in sessions]



@app.post("/sessions/{session_id}/summarize", response_model=dict)
def create_summary(
    session_id: int, 
    summary: schemas.SummaryCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Проверяем, принадлежит ли сессия пользователю
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session not found or access denied"
        )
    
    db_summary = crud.create_summary(db, session_id, summary.content)
    return {"summary_id": db_summary.id}

# ---------------------------
# Получение текста книги
# ---------------------------
@app.get("/books/{book_id}/text", response_class=PlainTextResponse)
def get_book_text(
    book_id: int, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this book")

    # Определяем кодировку
    result = chardet.detect(book.content)
    encoding = result['encoding'] if result['confidence'] > 0.7 else 'utf-8'

    try:
        text = book.content.decode(encoding)
    except Exception:
        text = book.content.decode('utf-8', errors='replace')

    return PlainTextResponse(text)

# ---------------------------
# Получение информации о книге
# ---------------------------
@app.get("/books/{book_id}", response_model=schemas.BookOut)
def get_book_info(
    book_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this book")
    
    return book

# ---------------------------
# Корневой маршрут
# ---------------------------
@app.get("/")
def read_root():
    return {"message": "Welcome to Book Reader API"}



# main.py
@app.put("/sessions/{session_id}/position")
def update_session_position(
    session_id: int,
    position: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    updated = crud.update_session_position(db, session_id, position)
    return {"success": True, "position": updated.current_position}

@app.get("/sessions/{session_id}")
def get_session_info(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = crud.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# main.py - добавить после существующих эндпоинтов
@app.put("/sessions/{session_id}/position/quick")
def quick_update_session_position(
    session_id: int,
    position: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Быстрое обновление позиции (без валидации книги)"""
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    session.current_position = position
    db.commit()
    return {"success": True, "position": session.current_position}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

