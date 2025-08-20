@echo off
echo Checking for updates...

if not exist mySFHS (
  mkdir mySFHS
)
cd mySFHS

curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/content.js" --output content.js
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/manifest.json" --output manifest.json

if not exist icons (
  mkdir icons
)
cd img
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/img/128.png" --output 128.png

cd ..

if not exist popup (
  mkdir popup
)
cd popup
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/popup/popup.html" --output popup.html
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/popup/popup.js" --output popup.js

cd ..

curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/run.bat" --output run.bat
