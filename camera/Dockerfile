# FROM nvcr.io/nvidia/deepstream-l4t:5.0.1-20.09-base

# RUN apt update && apt install -y v4l-utils &&\
#     wget https://bootstrap.pypa.io/get-pip.py && \
#     python3 get-pip.py && \
#     python3 -m pip install opencv-python
 
# ENV OPENBLAS_CORETYPE=ARMV8
 
# CMD ["gst-launch-1.0 > output.log 2>&1"]
 
# RUN mkdir code
 
# WORKDIR code

# COPY requirements.txt .
 
# RUN pip3 install -r requirements.txt
 
# ADD . .
 
# EXPOSE 8000

# base image 
FROM python:3.9

# define base user
RUN useradd -ms /bin/bash diycam
USER diycam

# declare workdirectory 
WORKDIR /home/diycam/code

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
