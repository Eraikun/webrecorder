FROM node:10.18.0

ENV TERM=xterm APP=/code

USER root

# add more arguments from CI to the image so that `$ env` should reveal more info
ARG CI_BUILD_ID
ARG CI_BUILD_REF
ARG CI_REGISTRY_IMAGE
ARG CI_PROJECT_NAME
ARG CI_BUILD_REF_NAME
ARG CI_BUILD_TIME

ENV CI_BUILD_ID=$CI_BUILD_ID CI_BUILD_REF=$CI_BUILD_REF CI_REGISTRY_IMAGE=$CI_REGISTRY_IMAGE \
    CI_PROJECT_NAME=$CI_PROJECT_NAME CI_BUILD_REF_NAME=$CI_BUILD_REF_NAME CI_BUILD_TIME=$CI_BUILD_TIME \
    npm_config_tmp=/tmp


ADD package.json yarn.lock $APP/

ADD src $APP/

WORKDIR $APP

RUN npm install --global --force yarn

RUN rm -rf node_modules && yarn add file-loader && yarn add eslint-webpack-plugin && yarn add url-loader && yarn add mini-css-extract-plugin && yarn add react-tooltip && yarn install && yarn cache clean && rm -rf ~/tmp/*
