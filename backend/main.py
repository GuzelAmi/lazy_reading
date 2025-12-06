# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import auth, crud, models, schemas
from app.database import get_db, engine
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import chardet
import re 
from app.schemas import HighlightCreate
# Создаем таблицы если их нет
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Book Reader API",
    version="1.0.0",
    description="API для чтения и конспектирования книг"
)

# РАБОЧИЙ CORS - ДОБАВЛЯЕМ САМЫМ ПЕРВЫМ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Middleware для ручной установки CORS заголовков
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


@app.options("/{path:path}")
async def options_route(path: str):
    return {}

@app.get("/")
def read_root():
    return {"message": "Welcome to Book Reader API", "docs": "/docs"}

# ---------------------------
# Регистрация и вход
# ---------------------------
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    return crud.create_user(db, user.username, user.password)

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

# ---------------------------
# Получение текущего пользователя
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

# ---------------------------
# Книги
# ---------------------------
@app.get("/books/", response_model=list[schemas.BookOut])
def get_user_books(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    books = db.query(models.Book).filter(models.Book.owner_id == current_user.id).all()
    return books

@app.post("/books/upload", response_model=schemas.BookOut)
def upload_book_file(
    book_file: UploadFile = File(...),
    title: str = Form(...),
    author: str | None = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Читаем файл
    content = book_file.file.read()
    
    # Создаем книгу
    book = crud.create_book(db, title=title, author=author, content=content, owner_id=current_user.id)
    
    return book

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
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Декодируем текст
    result = chardet.detect(book.content)
    encoding = result['encoding'] if result['confidence'] > 0.7 else 'utf-8'
    try:
        text = book.content.decode(encoding)
    except:
        text = book.content.decode('utf-8', errors='replace')
    
    return PlainTextResponse(text)

# ---------------------------
# Сессии (УПРОЩЕННЫЕ)
# ---------------------------
@app.post("/sessions/", response_model=schemas.SessionOut)
def create_session_endpoint(
    session: schemas.SessionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = crud.get_book(db, session.book_id)
    if not book or book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db_session = crud.create_session(db, session.name, session.book_id, current_user.id)
    return db_session

@app.get("/sessions/", response_model=list[dict])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.Session).filter(models.Session.user_id == current_user.id).all()
    
    # Преобразуем в словари
    result = []
    for session in sessions:
        # Находим книгу для названия
        book = db.query(models.Book).filter(models.Book.id == session.book_id).first()
        
        result.append({
            "id": session.id,
            "name": session.name,
            "book_id": session.book_id,
            "user_id": session.user_id,
            "current_position": session.current_position if hasattr(session, 'current_position') else 0,
            "total_sentences": 100,  # Временное значение
            "book_title": book.title if book else "Неизвестная книга",
            "book_author": book.author if book else None
        })
    
    return result

@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Удаляем связанные записи
    db.query(models.Highlight).filter(models.Highlight.session_id == session_id).delete()
    db.query(models.Summary).filter(models.Summary.session_id == session_id).delete()
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}

@app.get("/sessions/{session_id}")
def get_session_with_progress(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Получаем информацию о книге для расчета total_sentences
    book = crud.get_book(db, session.book_id)
    total_sentences = 0
    
    if book:
        try:
            # Определяем кодировку и получаем текст
            result = chardet.detect(book.content)
            encoding = result['encoding'] if result['confidence'] > 0.7 else 'utf-8'
            
            try:
                text = book.content.decode(encoding)
            except Exception:
                text = book.content.decode('utf-8', errors='replace')
            
            # Очищаем текст от HTML тегов
            text = re.sub(r'<[^>]*>', '', text)
            
            # Убираем рекламу - исправляем JavaScript синтаксис на Python
            patterns = [
                r'Спасибо, что скачали книгу в бесплатной электронной библиотеке Royallib\.ru.*',
                r'Все книги автора:.*',
                r'Эта же книга в других форматах:.*',
                r'Приятного чтения!.*',
                r'http://royallib\.ru.*',
                r'Приправа: \d+%.*',
                r'Предложение \d+ из \d+',
            ]
            
            for pattern in patterns:
                text = re.sub(pattern, '', text)
            
            # Разбиваем на предложения
            sentences = re.split(r'[.!?]+', text)
            
            # Фильтруем пустые и очень короткие предложения
            filtered_sentences = [s.strip() for s in sentences if len(s.strip()) > 3]
            total_sentences = len(filtered_sentences)
            
        except Exception as e:
            print(f"Error calculating sentences for book {book.id}: {e}")
            total_sentences = 0
    
    return {
        "id": session.id,
        "name": session.name,
        "book_id": session.book_id,
        "user_id": session.user_id,
        "current_position": session.current_position,
        "total_sentences": total_sentences
    }


@app.put("/sessions/{session_id}/position")
def update_session_position_endpoint(
    session_id: int,
    position: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    session.current_position = position
    db.commit()
    db.refresh(session)
    
    return {"success": True, "position": session.current_position}
# ---------------------------
# Выделения
# ---------------------------
@app.post("/sessions/{session_id}/highlights")
def add_highlight(
    session_id: int,
    highlight: HighlightCreate,  # Изменяем на Pydantic модель
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Создаем выделение
    db_highlight = models.Highlight(
        session_id=session_id, 
        sentence_index=highlight.sentence_index, 
        text=highlight.text
    )
    db.add(db_highlight)
    db.commit()
    db.refresh(db_highlight)
    
    return {"highlight_id": db_highlight.id}

@app.get("/sessions/{session_id}/highlights")
def get_session_highlights(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    highlights = db.query(models.Highlight).filter(models.Highlight.session_id == session_id).all()
    return highlights

# ---------------------------
# Конспекты
# ---------------------------
@app.post("/sessions/{session_id}/summarize")
def create_summary(
    session_id: int,
    summary_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Создаем конспект
    summary = models.Summary(
        session_id=session_id,
        content=summary_data.get("content", "")
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    
    return {"id": summary.id, "message": "Summary created"}

@app.get("/sessions/{session_id}/summary")
def get_session_summary_endpoint(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    summary = db.query(models.Summary).filter(models.Summary.session_id == session_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    return summary
# main.py - добавьте этот эндпоинт
@app.put("/sessions/{session_id}/progress")
def update_session_progress(
    session_id: int,
    current_position: int,
    total_sentences: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    session.current_position = current_position
    # Если нужно сохранять total_sentences в сессии, добавьте поле в модель
    # session.total_sentences = total_sentences
    db.commit()
    db.refresh(session)
    
    return {"success": True, "current_position": session.current_position}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)