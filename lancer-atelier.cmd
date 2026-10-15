@echo off
chcp 65001 >nul
rem Atelier Khattat : lance le petit serveur local puis ouvre le navigateur.
rem Fermer cette fenêtre (ou Ctrl+C) arrête l'atelier.
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js est introuvable : installez-le depuis https://nodejs.org puis relancez ce fichier. & pause & exit /b 1)
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8766/"
node tools\serve.js
pause
