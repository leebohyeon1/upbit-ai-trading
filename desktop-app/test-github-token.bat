@echo off
echo Testing GitHub Token...
echo.

curl -H "Authorization: token %GH_TOKEN%" https://api.github.com/user

echo.
echo.
echo Testing repository access...
curl -H "Authorization: token %GH_TOKEN%" https://api.github.com/repos/leebohyeon1/upbit-ai-trading

echo.
pause