#!/bin/bash

if [ "$NODE_ENV" = "development" ]
then
    echo "running production build"
    npm run docker-prod;
else
    echo "running development build"
    npm run docker-dev;
fi
