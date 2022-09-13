import datetime, requests, json
from api.service import routes

responses={    
            403: {
                "description":"Invalid Credentials",
                "content": {
                "application/json": {
                    "example": {"detail":"Bad Credentials"}
                        }
                    },
                },
            404: {
                "description":"Resource Not Found",
                "content": {
                "application/json": {
                    "example": {"detail":"Not Found"}
                        }
                    },
                },
            409: {
                "description":"Resource Already Exist",
                "content": {
                "application/json": {
                    "example": {"detail":"Already Exist in The System"}
                        }
                    },
                },
            500: {
                "description":"Something went wrong",
                "content": {
                "application/json": {
                    "example": {"detail":"Internal Server Error"}
                        }
                    },
                }
            }
