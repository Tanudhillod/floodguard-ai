from typing import Optional, List
from pydantic import BaseModel


class Location(BaseModel):
    text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class People(BaseModel):
    total: Optional[str] = None
    children: Optional[str] = None
    elderly: Optional[str] = None
    pregnant: Optional[str] = None
    injured: Optional[str] = None
    missing: Optional[str] = None
    deceased: Optional[str] = None
    mobility_impaired: Optional[str] = None


class Request(BaseModel):
    type: Optional[str] = None
    resources: List[str] = []


class Needs(BaseModel):
    food: bool = False
    water: bool = False
    medicine: bool = False
    shelter: bool = False
    rescue: bool = False
    medical_transfer: bool = False


class SOSExtraction(BaseModel):
    source_type: Optional[str] = None

    location: Location = Location()

    people: People = People()

    situation: Optional[str] = None

    request: Request = Request()

    needs: Needs = Needs()

    contact_info: List[str] = []

    original_message: str