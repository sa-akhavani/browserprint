# Base image: python3.7 (on Ubuntu) with a non-root user and dumb-init 
FROM python:3.7
RUN useradd -u 1000 -d /browserprint browserprint -m
RUN pip3 install dumb-init

# Install dependencies (as non-root user)
USER browserprint
WORKDIR /browserprint
COPY requirements_lock.txt /browserprint/
RUN pip3 install --user -r requirements_lock.txt

# Install application files/resources
COPY app.py /browserprint/

# ENV inputs and EXPOSEd ports
ENV HTTP_HOST localhost
ENV HTTP_PORT 8080
EXPOSE ${HTTP_PORT}

# Run app under dumb-init
ENTRYPOINT [ "dumb-init", "--" ]
CMD ["python3", "app.py"]
