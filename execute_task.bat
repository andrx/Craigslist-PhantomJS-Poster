@echo off
echo Enter task configuration file:
set /p file=""
echo Shuffle the lines in the text [y/N]:
set /p shuffle=""
cls
echo Task: %file%
echo Shuffle: %shuffle%
echo Starting...
phantomjs.exe --config=config.json scripts\execute_task.js %file% %shuffle%
rem phantomjs.exe --config=config.json scripts\execute_task.js task.json "n"
pause 