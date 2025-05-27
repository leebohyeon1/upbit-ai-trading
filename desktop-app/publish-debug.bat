@echo off
echo Publishing with debug info...
echo.

SET DEBUG=electron-builder

npm run publish:win

echo.
echo Check the output above for errors!
pause