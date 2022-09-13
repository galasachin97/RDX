from fastapi import UploadFile
import os
import shutil

from api.service.helpers.logs import console_logger

class Uploader:
    def __init__(self) -> None:
        self.staticServerPath = os.path.join(os.getcwd(), "static_server", "models")

    async def aiModelUploader(self, fileObject: UploadFile, serviceName: str):
        modelDirectoryPath = os.path.join(self.staticServerPath, serviceName)
        if not os.path.exists(modelDirectoryPath):
            os.makedirs(modelDirectoryPath)
        zipFilePath = os.path.join(modelDirectoryPath, fileObject.filename)
        contents = await fileObject.read()
        with open(zipFilePath, "wb") as f:
            f.write(contents)
        shutil.unpack_archive(zipFilePath, modelDirectoryPath)
        os.remove(zipFilePath)

uploadHandler = Uploader()