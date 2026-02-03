/**
 * mock-gas.js
 * Google Apps Script 환경을 로컬에서 흉내내는 모의 객체입니다.
 * 브라우저에서 index.html을 직접 열었을 때 작동합니다.
 */

if (typeof google === 'undefined') {
  console.log('🚧 Mock GAS Environment Activated');

  window.google = {
    script: {
      run: {
        withSuccessHandler: function(successCallback) {
          this._successHandler = successCallback;
          // [익명화] GitHub Pages 환경(Mock)에서는 개인정보 보호를 위해 이름을 CW/DK로 강제 변경
          setTimeout(() => {
            const replacements = [
              { selector: '.tax-item.chaewon .tax-label', text: 'CW 💜' },
              { selector: '.tax-item.dokwon .tax-label', text: 'DK 💙' },
              { selector: '#btn-chaewon', text: 'CW 💜' },
              { selector: '#btn-dokwon', text: 'DK 💙' },
              { selector: '#btn-buyer-chaewon span:last-child', text: 'CW' },
              { selector: '#btn-buyer-dokwon span:last-child', text: 'DK' },
              // Dues section text content replacement by finding specific structure
              { selector: '#duesTab div[style*="justify-content:space-between"] span:first-child', 
                filter: (el) => el.innerText === '채원', text: 'CW' },
              { selector: '#duesTab div[style*="justify-content:space-between"] span:first-child', 
                filter: (el) => el.innerText === '도권', text: 'DK' },
               // Table header
              { selector: '.record-header div:nth-child(2)', text: 'CW' },
              { selector: '.record-header div:nth-child(3)', text: 'DK' }
            ];

            replacements.forEach(item => {
              const elements = document.querySelectorAll(item.selector);
              elements.forEach(el => {
                if (item.filter && !item.filter(el)) return;
                el.innerText = item.text;
                // Add a visual indicator for mock mode if needed
              });
            });
            console.log('🔒 UI Anonymized for Guest Mode');
          }, 100); // UI 렌더링 후 실행
          
          return this;
        },
        withFailureHandler: function(failureCallback) {
          this._failureHandler = failureCallback;
          return this;
        },
        
        // --- Backend Function Mocks ---
        
        getTaxData: function() {
          console.log('[Mock] getTaxData called');
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                chaewonTotal: 150000,
                dokwonTotal: 120000,
                chaewonRefund: 45000,
                dokwonRefund: 36000,
                records: [
                  { date: '2025-01-15', chaewon: 1000, dokwon: 0, memo: '용돈', rowIndex: 5 },
                  { date: '2025-01-20', chaewon: 0, dokwon: 2000, memo: '심부름', rowIndex: 6 }
                ],
                year: 2025,
                availableYears: [2024, 2025],
                userName: 'Guest', // '부모님'으로 바꾸면 관리자 모드 테스트 가능
                isParent: false // true로 바꾸면 관리자 모드 테스트 가능
              });
            }
          }, 500); // Simulate network delay
        },

        getPendingApprovals: function() {
          console.log('[Mock] getPendingApprovals called');
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                list: [
                  {
                    rowIndex: 2,
                    requestTime: '2025-02-01 10:00',
                    requester: 'CW',
                    actionType: '세금 사용',
                    chaewon: -5000,
                    dokwon: 0,
                    memo: '공책 구매',
                    details: '구매자: CW, 총액: 5,000원'
                  }
                ]
              });
            }
          }, 500);
        },

        requestTax: function(person, allowance, memo, dateStr) {
          console.log('[Mock] requestTax called', { person, allowance, memo, dateStr });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true, // or false
                tax: Math.floor(allowance * 0.1)
              });
            }
          }, 500);
        },

        requestDues: function(dateStr, memo) {
          console.log('[Mock] requestDues called', { dateStr, memo });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true
              });
            }
          }, 500);
        },

        requestPurchase: function(chaewonAmount, dokwonAmount, description, dateStr) {
          console.log('[Mock] requestPurchase called', { chaewonAmount, dokwonAmount, description, dateStr });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true,
                chaewon: -chaewonAmount,
                dokwon: -dokwonAmount
              });
            }
          }, 500);
        },

        approveRequest: function(rowIndex) {
           console.log('[Mock] approveRequest called', rowIndex);
           setTimeout(() => {
             if (this._successHandler) {
               this._successHandler({ success: true, message: '승인되었습니다.' });
             }
           }, 500);
        },

        rejectRequest: function(rowIndex, reason) {
           console.log('[Mock] rejectRequest called', rowIndex, reason);
           setTimeout(() => {
             if (this._successHandler) {
               this._successHandler({ success: true, message: '거부되었습니다.' });
             }
           }, 500);
        },
        
        getYearData: function(year) {
          console.log('[Mock] getYearData called', year);
           setTimeout(() => {
            if (this._successHandler) {
              this._successHandler([
                  { date: year + '-01-15', chaewon: 1000, dokwon: 0, memo: '용돈', rowIndex: 5 },
                  { date: year + '-01-20', chaewon: 0, dokwon: 2000, memo: '심부름', rowIndex: 6 }
              ]);
            }
           }, 500);
        },
        
        updateRecord: function(year, rowIndex, chaewon, dokwon, memo) {
          console.log('[Mock] updateRecord called', {year, rowIndex, chaewon, dokwon, memo});
          setTimeout(() => {
             if (this._successHandler) {
               this._successHandler({ success: true, message: '수정 완료' });
             }
           }, 500);
        },
        
        deleteRecord: function(year, rowIndex) {
          console.log('[Mock] deleteRecord called', {year, rowIndex});
          setTimeout(() => {
             if (this._successHandler) {
               this._successHandler({ success: true });
             }
           }, 500);
        }
      }
    }
  };
}
