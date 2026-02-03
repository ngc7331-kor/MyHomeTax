# MyHomeTax

가족 세금 관리 및 용돈 기입장 시스템 (Google Apps Script 기반)

## 프로젝트 소개

이 프로젝트는 가족 구성원 간의 용돈, 세금(적립금), 회비 납부 등을 관리하기 위한 웹 애플리케이션입니다.
Google Sheets를 데이터베이스로 사용하며, Google Apps Script(GAS)를 통해 백엔드 로직이 수행됩니다.

## 기능

- **세금 계산 및 납부**: 용돈 기입 시 자동으로 10%의 세금이 계산되어 적립됩니다.
- **회비 납부**: 정해진 가족 회비를 납부하고 기록합니다.
- **세금 사용**: 적립된 세금을 사용하여 가족 공통 지출이나 개인 물품을 구매할 수 있습니다.
- **승인 시스템**: 자녀가 요청한 내역은 부모님(관리자)의 승인을 거쳐 최종 기록됩니다.
- **연말정산 및 환급**: 연말에 적립된 세금의 일부를 환급받을 수 있는 시뮬레이션 기능이 포함되어 있습니다.

## 로컬 개발 환경 (Local Development)

이 프로젝트는 로컬에서도 UI 및 기본 로직을 테스트할 수 있도록 모의(Mock) 환경을 포함하고 있습니다.

1. `index.html` 파일을 브라우저(Chrome, Edge 등)에서 직접 엽니다.
2. 자동으로 `mock-gas.js`가 로드되어 Google Apps Script 환경을 흉내냅니다.
3. 데이터 조회, 추가, 수정, 삭제 등의 동작이 가상의 데이터로 수행됩니다.
   - _주의: 로컬에서 수행한 작업은 실제 구글 스프레드시트에 저장되지 않습니다._

## 배포 방법 (Deployment)

1. [Google Apps Script](https://script.google.com/) 새 프로젝트 생성.
2. `Code.gs` 파일의 내용을 Apps Script 프로젝트의 `Code.gs`에 복사.
3. `index.html` 파일의 내용을 Apps Script 프로젝트의 `index.html`에 복사 (이때 `mock-gas.js` 스크립트 태그는 제거하는 것이 좋으나, 두어도 상관없음).
4. **배포** > **새 배포** > **유형 선택: 웹 앱**.
   - **액세스 권한**: _나(또는 Google 계정이 있는 모든 사용자)_ 로 설정하되, 코드 내에서 이메일 화이트리스트(`ALLOWED_EMAILS`)로 접근을 제어합니다.
5. 배포된 URL을 가족들에게 공유.

## 파일 구조

- `Code.gs`: Google Apps Script 백엔드 코드 (서버 사이드)
- `index.html`: 웹 애플리케이션 프론트엔드 (UI)
- `mock-gas.js`: 로컬 개발용 Mocking 스크립트
- `README.md`: 프로젝트 설명서

## 라이선스

Private Scope (Family Use Only)
