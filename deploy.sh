env=$1
git reset --hard
git pull
npm run build
pm2 delete casino_api
if [[ $env = "staging" ]] then
    export NODE_ENV="staging"
elif [[ $env = "prod" ]] then
    export NODE_ENV="prod"
fi
pm2 start dist/main.js --name casino_api