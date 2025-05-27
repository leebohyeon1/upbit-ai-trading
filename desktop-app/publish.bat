@echo off
echo Publishing Electron app to GitHub Releases...
echo.
echo Make sure you have:
echo 1. Created a GitHub Personal Access Token with 'repo' scope
echo 2. Set GH_TOKEN in .env file or environment variable
echo.
pause

npm run publish:win

echo.
echo Publish complete! Check GitHub Releases page.
pause