from typing import List, Optional
from fastapi import FastAPI
from pydantic import *


def normalize(name: str) -> str:
    # it removes the space from input
    return name.lower().strip()


def shine_full_name(name: str) -> str:
    # it make each first letter of the word captalized
    name = name.strip()
    return ' '.join((word.capitalize()) for word in name.split(' '))


class Token(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    fullname: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    EmailVerified: Optional[bool] = None    

    # _shine_full_name = validator('username',allow_reuse=True)(shine_full_name)


class AccessToken(BaseModel):
    access_token: str


    
class UserRegisterPostIn(BaseModel):
    FullName: str
    Username: str
    Password: constr(min_length=8)
    Email: str
    Phone: str
    Status: bool

    _shine_full_name = validator('FullName',allow_reuse=True)(shine_full_name)
    _fix_username = validator('Username', allow_reuse=True)(normalize)
    

class UCreateUserPostIn(BaseModel):
    FullName: str
    Username: str
    Password: constr(min_length=8)    
    Email: str
    Phone: str
    Role: str
    EmailVerified: bool

    _shine_full_name = validator('FullName',allow_reuse=True)(shine_full_name)
    _fix_username = validator('Username', allow_reuse=True)(normalize)

class UserUpdatePutIn(BaseModel):
    FullName: Optional[str]=None
    Username: Optional[str]=None    
    Email: Optional[str]=None
    Phone: Optional[str]=None
    Role: Optional[str]=None
    EmailVerified: Optional[bool]=None

    _shine_full_name = validator('FullName',allow_reuse=True)(shine_full_name)
    _fix_username = validator('Username', allow_reuse=True)(normalize)


class UpdateUsersPassword_post_in(BaseModel):
    Old_password: str
    New_password: constr(min_length=8)


class VerifyPasswordPostIn(BaseModel):
    Password: str
    

class LogActivityPostIn(BaseModel):
    Action: str
    Result: str

class ManufactureRegisterPostIn(BaseModel):
    ID: str
    Password: constr(min_length=8)

class FactoryResetPostIn(BaseModel):    
    WithAccessKey: bool
    

class LogActivityGetIn(BaseModel):
    Username: str    
    

class UserActivityLog(BaseModel):
    Username : str
    Action: str
    Activity_result : str
    Date: str
    Time: str
    LastModified: str


class LogActivityGetOut(BaseModel):
    Data: Optional[List[UserActivityLog]]=None
    Total_count: Optional[int]=None


class ForgotPassword_post_in(BaseModel):
    Username: Optional[str]=None
    New_password: Optional[constr(min_length=8)]=None

    _fix_username = validator('Username', allow_reuse=True)(normalize)


class VerifyEmailPostIn(BaseModel):
    Username: str
    Email: str

    _fix_username = validator('Username', allow_reuse=True)(normalize)

class ListUsersGetIn(BaseModel):
    Username: Optional[str]=None

    _fix_username = validator('Username', allow_reuse=True)(normalize)
    

class ListUsersGetOut(BaseModel):
    Data: Optional[List[UserUpdatePutIn]]=None
    Page_size: Optional[int]=None
    Page_number: Optional[int]=None
    Total_count: Optional[int]=None


class ValidateOTPPostIn(BaseModel):
    OTP: str
    Username: str
    ID: int


class ResetUsersPasswordPostIn(BaseModel):
    Username: str
    Password: constr(min_length=8)

    _fix_username = validator('Username', allow_reuse=True)(normalize)

class CurrentUserGetOut(BaseModel):
    FullName: Optional[str]=None
    Username: Optional[str]=None
    Permission: Optional[str]=None
    Email: Optional[str]=None
    Phone: Optional[str]=None
    Role: Optional[str]=None


class DefaultResponseModel(BaseModel):
    detail: str


class CheckDuplicatesPostIn(BaseModel):
    Username: Optional[str]=None    
    Email: Optional[str]=None
    Phone: Optional[str]=None    

    _fix_username = validator('Username', allow_reuse=True)(normalize)


class OtpDeviceIn(BaseModel):
    accessKey: Optional[str]
    username: Optional[str]
    destination: Optional[str]
    otp: str
    interval: str