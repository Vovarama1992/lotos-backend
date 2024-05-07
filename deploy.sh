git reset --hard
git pull
npm run build
pm2 delete casino_api
pm2 start dist/main.js --name casino_api