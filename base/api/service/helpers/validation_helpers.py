from api.service.helpers import auth
from fastapi.security.http import HTTPBase
from fastapi import Depends
from api.service.helpers.logs import console_logger
import json


def validate_user(token: str = Depends(HTTPBase(scheme='Bearer'))):
    user = auth.authenticate_user(token)
    allowed_roles = ["Admin", "Superadmin", "Manufacturer", "Operator"]
    if user["role"] in allowed_roles:
        return True
    return False

def validate_user_admin(token: str = Depends(HTTPBase(scheme='Bearer'))):
    user = auth.authenticate_user(token)
    allowed_roles = ["Admin", "Superadmin", "Manufacturer"]
    if user["role"] in allowed_roles:
        return True
    return False

def validate_superadmin(token: str = Depends(HTTPBase(scheme='Bearer'))):
    user = auth.authenticate_user(token)
    if user["role"] == "Superadmin":
        return True
    return False


def auth_user_telegram(token: str = Depends(HTTPBase(scheme='Bearer'))):
    user = auth.authenticate_user(token)
   
    allowed_roles = ["Admin", "Superadmin"]
    if user["role"] in allowed_roles:
        return user['username']
    return None