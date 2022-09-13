from pydantic import BaseModel
from typing import List, Optional

class DownloadServicePostIn(BaseModel):
    serviceId: str

class ActivateServicePostIn(BaseModel):
    serviceId: List[str]

class DeactivateServicePostIn(BaseModel):
    serviceIds: List[str]

class UpdateServicePostIn(BaseModel):
    serviceId: str

class ServiceSettingsPostIn(BaseModel):
    serviceId: str

class SystemUpdateSchedPostIn(BaseModel):
    time: Optional[str] = None
    auto_update: bool