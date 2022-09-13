from typing import List
from pydantic import BaseModel


class DefaultResponseModel(BaseModel):
    detail: str

def _404(desc='Not Found', detail='Not Found') -> dict:
    return {
        'model': DefaultResponseModel,
        'description': desc,
        'content': {
            'application/json': {
                'example': {
                    'detail': detail
                }
            }
        }
    }


def _500(desc='Internal Server Error', detail='Internal Server Error') -> dict:
    return {
        'model': DefaultResponseModel,
        'description': desc,
        'content': {
            'application/json': {
                'example': {
                    'detail': detail
                }
            }
        }
    }


def _403(desc='Forbidden', detail='Forbidden') -> dict:
    return {
        'model': DefaultResponseModel,
        'description': desc,
        'content': {
            'application/json': {
                'example': {
                    'detail': detail
                }
            }
        }
    }


def _401() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Requesting with authentication with an Expired, Wrong User Type or Invalid Token',
        'content': {
            'application/json': {
                'example': {'detail': 'Invalid Token'}
            }
        }
    }

def _200() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Call was successful',
        'content': {
            'application/json': {
                'example': {'detail': 'Success'}
            }
        }
    }

def _502() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Bad Gateway',
        'content': {
            'application/json': {
                'example': {'detail': 'Diycam cloud is down'}
            }
        }
    }

def _506() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Improperly configured',
        'content': {
            'application/json': {
                'example': {'detail': 'Improperly configured'}
            }
        }
    }

def _409() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Conflict',
        'content': {
            'application/json': {
                'example': {'detail': 'Conflict'}
            }
        }
    }

def _400() -> dict:
    return {
        'model': DefaultResponseModel,
        'description': 'Bad Request',
        'content': {
            'application/json': {
                'example': {'detail': 'Bad Request'}
            }
        }
    }