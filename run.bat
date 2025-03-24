@echo off
echo Checking for updates...

if not exist mySFHS (
  mkdir mySFHS
)
cd mySFHS

curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/content.js" --output content.js
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/jquery-3.7.1.min.js" --output jquery-3.7.1.min.js
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/manifest.json" --output manifest.json
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/popup.html" --output popup.html

if not exist icons (
  mkdir icons
)
cd icons
curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/icons/128.png" --output 128.png

cd ..
cd ..

curl "https://raw.githubusercontent.com/SuperSteve9/MySFHSplus/refs/heads/main/run.bat" --output run.bat
