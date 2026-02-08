// GitHub Pages에서 직접 접속 시 차단 (보안 강화)
if (window.location.hostname.includes("github.io")) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;text-align:center;font-family:sans-serif;">
      <h2 style="color:#ef4444;">⛔ 접근 권한이 없습니다</h2>
      <p>이 페이지는 정적 파일이며, 보안상 기능을 제공하지 않습니다.</p>
      <p><strong>앱스스크립트(Google Apps Script) 주소</strong>로 접속해주세요.</p>
    </div>
  `;
  throw new Error("GitHub Pages Access Blocked");
}

if (typeof google === "undefined") {
  console.log("🚧 Mock GAS Environment Activated");

  window.google = {
    script: {
      run: {
        withSuccessHandler: function (successCallback) {
          this._successHandler = successCallback;
          return this;
        },
        withFailureHandler: function (failureCallback) {
          this._failureHandler = failureCallback;
          return this;
        },

        // --- Backend Function Mocks ---

        getTaxData: function () {
          console.log("[Mock] getTaxData called");
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                cwTotal: 150000,
                dkTotal: 120000,
                cwRefund: 45000,
                dkRefund: 36000,
                records: [
                  {
                    date: "2025-01-15",
                    cw: 1000,
                    dk: 0,
                    memo: "용돈",
                    rowIndex: 5,
                  },
                  {
                    date: "2025-01-20",
                    cw: 0,
                    dk: 2000,
                    memo: "심부름",
                    rowIndex: 6,
                  },
                ],
                year: 2025,
                availableYears: [2024, 2025],
                userName: "Guest", // '부모님'으로 바꾸면 관리자 모드 테스트 가능
                isParent: false, // true로 바꾸면 관리자 모드 테스트 가능
              });
            }
          }, 500); // Simulate network delay
        },

        getPendingApprovals: function () {
          console.log("[Mock] getPendingApprovals called");
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                list: [
                  {
                    rowIndex: 2,
                    requestTime: "2025-02-01 10:00",
                    requester: "cw",
                    actionType: "세금 사용",
                    cw: -5000,
                    dk: 0,
                    memo: "공책 구매",
                    details: "구매자: cw, 총액: 5,000원",
                  },
                ],
              });
            }
          }, 500);
        },

        requestTax: function (person, allowance, memo, dateStr) {
          console.log("[Mock] requestTax called", {
            person,
            allowance,
            memo,
            dateStr,
          });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true, // or false
                tax: Math.floor(allowance * 0.1),
              });
            }
          }, 500);
        },

        requestDues: function (dateStr, memo) {
          console.log("[Mock] requestDues called", { dateStr, memo });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true,
              });
            }
          }, 500);
        },

        requestPurchase: function (cwAmount, dkAmount, description, dateStr) {
          console.log("[Mock] requestPurchase called", {
            cwAmount,
            dkAmount,
            description,
            dateStr,
          });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                needsApproval: true,
                cw: -cwAmount,
                dk: -dkAmount,
              });
            }
          }, 500);
        },

        approveRequest: function (rowIndex) {
          console.log("[Mock] approveRequest called", rowIndex);
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                message: "승인되었습니다.",
              });
            }
          }, 500);
        },

        rejectRequest: function (rowIndex, reason) {
          console.log("[Mock] rejectRequest called", rowIndex, reason);
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({
                success: true,
                message: "거부되었습니다.",
              });
            }
          }, 500);
        },

        getYearData: function (year) {
          console.log("[Mock] getYearData called", year);
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler([
                {
                  date: year + "-01-15",
                  cw: 1000,
                  dk: 0,
                  memo: "용돈",
                  rowIndex: 5,
                },
                {
                  date: year + "-01-20",
                  cw: 0,
                  dk: 2000,
                  memo: "심부름",
                  rowIndex: 6,
                },
              ]);
            }
          }, 500);
        },

        updateRecord: function (year, rowIndex, cw, dk, memo) {
          console.log("[Mock] updateRecord called", {
            year,
            rowIndex,
            cw,
            dk,
            memo,
          });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({ success: true, message: "수정 완료" });
            }
          }, 500);
        },

        deleteRecord: function (year, rowIndex) {
          console.log("[Mock] deleteRecord called", { year, rowIndex });
          setTimeout(() => {
            if (this._successHandler) {
              this._successHandler({ success: true });
            }
          }, 500);
        },
      },
    },
  };
}
