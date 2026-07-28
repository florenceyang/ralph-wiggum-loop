from pydantic import BaseModel, validator
from typing import Optional, Any
import re

# Allowed icons per spec
ICON_CHOICES = ["circle", "heart", "diamond", "square", "star", "triangle"]
HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{6})$")


class HabitCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None

    @validator("name")
    def name_non_empty(cls, v: Any) -> Any:
        if not v or not v.strip():
            raise ValueError("name must not be empty")
        if len(v) > 255:
            raise ValueError("name must be <=255 chars")
        return v

    @validator("icon")
    def icon_valid(cls, v: Any) -> Any:
        if v is None:
            return v
        if v not in ICON_CHOICES:
            raise ValueError(f"icon must be one of {ICON_CHOICES}")
        return v

    @validator("color")
    def color_valid(cls, v: Any) -> Any:
        if v is None:
            return v
        if not HEX_COLOR_RE.match(v):
            raise ValueError("color must be a hex string like #rrggbb")
        return v


class HabitResponse(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    order: int
