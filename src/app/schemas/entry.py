from pydantic import BaseModel, validator
from typing import Optional, Any
import re

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class EntryCreate(BaseModel):
    habit_id: str
    date: str
    done: Optional[bool] = True
    note: Optional[str] = None

    @validator("date")
    def date_format(cls, v: Any) -> Any:
        if not DATE_RE.match(v):
            raise ValueError("date must be YYYY-MM-DD")
        return v


class EntryResponse(BaseModel):
    id: str
    habit_id: str
    date: str
    done: bool
    note: Optional[str] = None
