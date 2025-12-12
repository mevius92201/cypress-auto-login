describe("滑塊驗證測試", () => {
  const config = {
    testUrl: "https://swag.live",
    sliderSelector: ".geetest_btn",
    bgCanvasSelector: ".geetest_bg",
    gapCanvasSelector: ".geetest_slice_bg",
    successSelector: ".geetest_lock_success",
  };

  it("智能滑塊驗證", () => {
    // ============ 攔截背景請求，允許翻譯和圖片 ============
    cy.intercept("**/api.swag.live/pusher/**", { forceNetworkError: true }).as(
      "pusher"
    );
    cy.intercept("**/api.swag.live/feed**", { forceNetworkError: true }).as(
      "feed"
    );
    cy.intercept("**/api.swag.live/user/**", { forceNetworkError: true }).as(
      "user"
    );
    cy.intercept("**/api.swag.live/story/**", { forceNetworkError: true }).as(
      "story"
    );
    cy.intercept("**/api.swag.live/session**", { forceNetworkError: true }).as(
      "session"
    );
    cy.intercept("**/api.swag.live/message**", { forceNetworkError: true }).as(
      "message"
    );
    cy.intercept("**/api.swag.live/configurations/**", {
      forceNetworkError: true,
    }).as("config");

    cy.intercept("**/sentry.io/**", { forceNetworkError: true }).as("sentry");
    cy.intercept("**/*zendesk*/**", { forceNetworkError: true }).as("zendesk");
    cy.intercept("**/*hotjar*/**", { forceNetworkError: true }).as("hotjar");
    cy.intercept("**/*analytics*/**", { forceNetworkError: true }).as(
      "analytics"
    );
    cy.intercept("**/collect**", { forceNetworkError: true }).as("collect");
    cy.intercept("**/track**", { forceNetworkError: true }).as("track");

    cy.visit(config.testUrl, { timeout: 10000, failOnStatusCode: false });

    cy.get("body", { timeout: 5000 }).should("exist");
    cy.log("✓ 網頁載入成功");

    cy.wait(5000);

    // 免費註冊登入的按鈕對應的class
    cy.get(".LandingContent__LoginRegisterButton-sc-68dc63b-7", {
      timeout: 10000,
    })
      .should("be.visible")
      .click({ force: true });
    cy.log("✓ 點擊登入");

    cy.wait(3000);

    // 已有帳號點此登入的按鈕對應的class
    cy.get(".AuthenticateMethodSelect__EntryButton-sc-a44af821-20", {
      timeout: 10000,
    })
      .should("be.visible")
      .click();
    cy.log("✓ 已選擇驗證形式");

    // 切換輸入帳號密碼
    cy.get(".EmailPhoneForm__MethodToggleButton-sc-b748f2b7-12", {
      timeout: 10000,
    })
      .should("be.visible")
      .click();
    cy.log("✓ Username and Password Login");

    // user input對應的class
    cy.get(`#username-form`, {
      timeout: 10000,
    })
      .should("be.visible")
      .type("qa_test_ying");
    cy.log("✓ 已填入使用者帳號");

    // password input對應的class
    cy.get("#password-form", {
      timeout: 10000,
    })
      .should("be.visible")
      .type("qaying");
    cy.log("✓ 已填入密碼");

    // 登入按鈕對應的class
    cy.get(".UsernamePasswordForm__SubmitButton-sc-a1a7333c-23", {
      timeout: 10000,
    })
      .should("be.visible")
      .click();
    cy.log("✓ 已點擊開始驗證");

    cy.wait(1000);

    cy.get(config.sliderSelector, { timeout: 10000 }).should("be.visible");
    cy.get(config.bgCanvasSelector, { timeout: 10000 }).should("be.visible");
    cy.get(config.gapCanvasSelector, { timeout: 10000 }).should("be.visible");

    cy.wait(1000);

    cy.smartSlideVerification(
      config.sliderSelector,
      config.bgCanvasSelector,
      config.gapCanvasSelector
    );

    cy.wait(1000);

    cy.get("body").then(($body) => {
      if ($body.find(config.successSelector).length > 0) {
        cy.log("滑塊驗證成功！");
      }
    });
  });
});
