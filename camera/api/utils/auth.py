from fastapi.exceptions import HTTPException
from fastapi.param_functions import Depends
from fastapi.security.http import HTTPBase
from starlette import status
from mongoengine import *
from jose import jwt
import json
from functools import wraps

from config import Config

_schema = {
    "access_token":{
        "iat": None,
        "sub": None,
        "exp": None
    },
    # "refresh_token":{
    #     "iat": None,
    #     "sub": None,
    #     "exp": None
    # }
}

def authenticate_user_token(token: str = Depends(HTTPBase(scheme='Bearer'))):    
    payload = decode_access_token(token.credentials)
    user_data = json.loads(payload["sub"].replace("'", '"'))
    user_data['token'] = token.credentials
    return user_data


def decode_access_token(token):
    try:
        return jwt.decode(
            token, 
            Config.SECRET_KEY, 
            algorithms=Config.ALGORITHM)
    except (jwt.JWTError, jwt.ExpiredSignatureError) as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Token')


''' Decorater to Check User Permissions as Manufacturer/Superadmin/Admin/Operator '''
def permission_required(access):    
    def inner_function(function):
        @wraps(function)
        async def wrapper(*args, **kwargs):             
            if kwargs['payload']['role'] in access:
                return await function(*args,**kwargs)
            raise HTTPException(status_code=403, detail="No Permission")          
        return wrapper
    return inner_function