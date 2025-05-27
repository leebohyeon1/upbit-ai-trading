@echo off
echo Publishing with full logging...
echo.

SET DEBUG=electron-builder
SET ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

echo Starting build and publish process...
echo.

npm run publish:win > publish-log.txt 2>&1

echo.
echo Process completed. Check publish-log.txt for details.
echo.
type publish-log.txt
echo.
pause