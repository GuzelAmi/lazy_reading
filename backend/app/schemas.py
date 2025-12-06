# app/schemas.py
from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class BookOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None

    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: int
    name: str
    book_id: int
    user_id: int
    current_position: int = 0

    class Config:
        from_attributes = True
class SessionCreate(BaseModel):
    name: str
    book_id: int

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class HighlightCreate(BaseModel):
    sentence_index: int
    text: str

class HighlightOut(BaseModel):
    id: int
    session_id: int
    sentence_index: int
    text: str

    class Config:
        from_attributes = True