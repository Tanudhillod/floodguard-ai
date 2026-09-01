from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from backend.database import Base


class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    status = Column(
        String,
        default="Pending"
    )

    original_message = Column(
        Text,
        nullable=False
    )

    extracted_data = Column(
        Text,
        nullable=False
    )