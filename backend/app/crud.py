from sqlalchemy.orm import Session
from app import models, auth

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str, password: str):
    hashed_password = auth.get_password_hash(password)
    user = models.User(username=username, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_book(db: Session, title: str, author: str | None, content: bytes, owner_id: int):
    book = models.Book(title=title, author=author, content=content, owner_id=owner_id)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.id == book_id).first()

def create_session(db: Session, name: str, book_id: int, user_id: int):
    session = models.Session(name=name, book_id=book_id, user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def create_summary(db: Session, session_id: int, content: str):
    summary = models.Summary(session_id=session_id, content=content)
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary

# app/crud.py
def update_session_position(db: Session, session_id: int, position: int):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if session:
        session.current_position = position
        db.commit()
        db.refresh(session)
    return session

def get_session(db: Session, session_id: int):
    return db.query(models.Session).filter(models.Session.id == session_id).first()


def create_highlight(db: Session, session_id: int, sentence_index: int, text: str):
    highlight = models.Highlight(session_id=session_id, sentence_index=sentence_index, text=text)
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    return highlight

def get_session_highlights(db: Session, session_id: int):
    return db.query(models.Highlight).filter(models.Highlight.session_id == session_id).all()