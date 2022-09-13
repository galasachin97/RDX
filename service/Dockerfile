FROM python:3.9

RUN useradd -ms /bin/bash diycam
RUN apt-get update && apt-get install -y ffmpeg
USER diycam

WORKDIR /home/diycam/code

COPY --chown=diycam:diycam requirements.txt .
RUN pip install ffmpeg-python
RUN pip install --user -r requirements.txt  

COPY --chown=diycam:diycam . .

EXPOSE 8000
