REM use python as host (Chrome restricts file system access)
START /b python -m SimpleHTTPServer 8888

REM start Chrome in application mode (no toolbars)
REM you may have to change the location to Chrome below 
C:\Users\%USERNAME%.%USERDOMAIN%\AppData\Local\Google\Chrome\Application\chrome.exe --app="http://localhost:8888"
