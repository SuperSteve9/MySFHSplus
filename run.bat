echo "Checking for updates"
if exists mySFHS/ (
  cd mySFHS
) else (
  mkdir mySFHS
  cd mySFHS
)

curl "https://github.com/SuperSteve9/MySFHSplus/new/main/content.js" --output content.js
curl "https://github.com/SuperSteve9/MySFHSplus/new/main/jquery-3.7.1.min.js" --output jquery-3.7.1.min.js
curl "https://github.com/SuperSteve9/MySFHSplus/new/main/manigest.json" --output manifest.json
curl "https://github.com/SuperSteve9/MySFHSplus/new/main/popup.html" --output popup.html

if exists icons/ (
  cd icons
) else (
  mkdir icons
  cd icons
)
curl "https://github.com/SuperSteve9/MySFHSplus/new/main/icons/128.png" --output 128.png

cd ..
cd ..

curl "https://github.com/SuperSteve9/MySFHSplus/new/main/run.bat" --output run.bat
