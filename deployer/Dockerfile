FROM ubuntu:18.04

RUN  apt-get update \
  && apt-get install -y wget \
  && rm -rf /var/lib/apt/lists/*

#Install required files and packages and clean folders after that
RUN apt-get update \
  && apt-get -y install iceweasel \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*
RUN apt-get -y purge iceweasel \
  &&  rm -rf /opt/firefox

# Install Firefox
ENV LC_ALL C
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN true
ARG FIREFOX_VERSION=69.0
ARG FIREFOX_DOWNLOAD_URL="http://ftp.mozilla.org/pub/firefox/releases/$FIREFOX_VERSION/linux-x86_64/en-US/firefox-$FIREFOX_VERSION.tar.bz2"

RUN wget -O /tmp/firefox.tar.bz2 $FIREFOX_DOWNLOAD_URL
  
RUN rm -rf /opt/firefox \
  && tar -C /opt -xjf /tmp/firefox.tar.bz2 \
  && rm /tmp/firefox.tar.bz2 \
  && mv /opt/firefox /opt/firefox-$FIREFOX_VERSION \
  && ln -fs /opt/firefox-$FIREFOX_VERSION/firefox /usr/bin/firefox

# Install vnc
RUN apt-get update \
  && apt-get install -y x11vnc xvfb
RUN mkdir ~/.vnc
RUN x11vnc -storepasswd 1234 ~/.vnc/passwd

#Create Profile
RUN firefox -CreateProfile "browserprint /browserprint" --headless
ADD ./user.js /browserprint/

ENTRYPOINT [ "/bin/bash" ]

# Run this command in the docker terminal
# firefox --profile browserprint --url "https://google.com"
# docker run -p 5900:5900 -e HOME=/ firefox-headless x11vnc -forever -create