import "./commands";

// ============ 全局忽略所有未捕獲的異常 ============

Cypress.on("uncaught:exception", (err, runnable) => {
  // 返回 false 表示忽略錯誤，讓測試繼續

  console.log("忽略的錯誤:", err.message);
  return false;
});
