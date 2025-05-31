!macro customInit
  ; 이전 버전 실행 중인지 확인하고 종료
  nsExec::ExecToLog 'taskkill /F /IM "Upbit AI Trading.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "electron.exe"'
  
  ; 잠시 대기
  Sleep 1000
!macroend

!macro customInstall
  ; 설치 후 바탕화면 바로가기 생성
  CreateShortCut "$DESKTOP\Upbit AI Trading.lnk" "$INSTDIR\Upbit AI Trading.exe"
!macroend

!macro customUnInstall
  ; 언인스톨 전에 실행 중인 프로세스 종료
  nsExec::ExecToLog 'taskkill /F /IM "Upbit AI Trading.exe"'
  nsExec::ExecToLog 'taskkill /F /IM "electron.exe"'
  
  ; 바탕화면 바로가기 삭제
  Delete "$DESKTOP\Upbit AI Trading.lnk"
!macroend