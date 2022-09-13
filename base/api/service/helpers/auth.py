from fastapi.security.http import HTTPBase
from fastapi.param_functions import Depends
from fastapi import HTTPException, status
from jose import JWTError, jwt
import datetime
import json
from config import Config
from api.service.helpers.logs import console_logger

def authenticate_user(token):
    payload = decode_token(token.credentials)
    user_data = json.loads(payload["sub"].replace("'", '"'))
    user_data['token'] = token.credentials
    return user_data

def decode_token(token):
    try:
        return jwt.decode(
            token, 
            Config.SECRET_KEY, 
            algorithms=Config.ALGORITHM)
    except (jwt.JWTError, jwt.ExpiredSignatureError) as e:
        console_logger.debug(e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Token')


