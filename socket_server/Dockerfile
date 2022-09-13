# FROM python:3.6.13-alpine3.13

# # RUN addgroup -S diycam && adduser -S -G diycam diycam 

# RUN apk update && apk add python3-dev gcc libc-dev build-base bash

# # USER diycam

# # RUN cd /home/diycam && mkdir code
# RUN mkdir code

# # WORKDIR /home/diycam/code
# WORKDIR /code

# # COPY --chown=diycam:diycam requirements.txt .
# COPY requirements.txt .

# # RUN pip install --user -r requirements.txt  
# RUN pip install -r requirements.txt 

# COPY wait-for-it.sh .

# COPY . .

# EXPOSE 8000

# ENV PYTHONBUFFERED=1
# # ENTRYPOINT [  ]

# # CMD [ "python3", "app.py" ]
# base image 
FROM python:3.9

# define base user
RUN useradd -ms /bin/bash diycam
USER diycam

# declare workdirectory 
WORKDIR /code

# install dependancies
COPY --chown=diycam:diycam ./requirements.txt .
RUN pip install --user -r requirements.txt  

# add code
ADD --chown=diycam:diycam . .

# make sciprt executable
RUN ["chmod", "+x", "wait-for-it.sh"]

# expose port
EXPOSE 8000

# define defualt cmd
# CMD ["./wait-for-it.sh", "mongo:27017", "-t", "0", "--", "python", "run.py"]
