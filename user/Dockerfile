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
