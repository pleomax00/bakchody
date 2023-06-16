FROM python:3.9.7-slim
ENV PYTHONUNBUFFERED 1

RUN apt-get update 
RUN apt install -y build-essential python3-dev vim curl 
RUN mkdir /app
RUN echo "alias ls='ls --color=auto'" >> ~/.bashrc

WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/

EXPOSE 10022

ENTRYPOINT /app/entrypoint.sh
