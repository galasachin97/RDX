from typing import List, Optional
from pydantic import BaseModel


class DefaultResponseModel(BaseModel):
    detail: str

class PagiantionModel(BaseModel):
    total_data: int
    per_page: int

class AsyncTask(BaseModel):
    Task_name: str

class UsbList(BaseModel):
    usblist: Optional[List]

class HealthCheck(BaseModel):
    detail: bool
    image_path: Optional[str]=None