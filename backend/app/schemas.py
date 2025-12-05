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
        from_attributes = True  # Заменяем orm_mode = True для Pydantic v2

class BookOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None

    class Config:
        from_attributes = True

class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None

class SessionCreate(BaseModel):
    name: str
    book_id: int


# app/schemas.py
class SessionOut(BaseModel):
    id: int
    name: str
    book_id: int
    user_id: int
    current_position: int = 0

    class Config:
        from_attributes = True



class SummaryCreate(BaseModel):
    content: str

class SummaryOut(BaseModel):
    id: int
    session_id: int
    content: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class TokenData(BaseModel):
    username: Optional[str] = None

# app/schemas.py - добавьте
class BookWithSessionOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    session_id: Optional[int] = None
    
    class Config:
        from_attributes = True