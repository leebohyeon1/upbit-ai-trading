// 개발 모드 전용 실행 파일
process.env.NODE_ENV = 'development';
process.env.ELECTRON_DEV_MODE = 'true';

// 개발 모드에서는 다른 userData 경로 사용
const { app } = require('electron');
const path = require('path');

// 앱이 준비되기 전에 이름 설정
app.name = 'Upbit AI Trading';

// 개발 모드용 별도 userData 경로 설정 (설치된 버전과 분리)
app.setPath('userData', path.join(app.getPath('appData'), 'Upbit AI Trading Dev'));

// 메인 프로세스 실행
require('./dist/main.js');