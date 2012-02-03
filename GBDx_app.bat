cd %~dp0

REM use python as host (Chrome restricts file system access)
START /b %~dp0\offline\python\app\python.exe -m SimpleHTTPServer 8888

REM start Chrome in application mode (no toolbars)
REM you may have to change the location to Chrome below 
%~dp0\offline\chrome\Chrome\chrome.exe --enable-file-access-from-files --allow-running-insecure-content --app="http://localhost:8888"