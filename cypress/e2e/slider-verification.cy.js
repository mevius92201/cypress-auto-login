describe("滑塊驗證測試", () => {
  const config = {
    testUrl: "https://swag.live",
    sliderSelector: ".geetest_btn",
    bgCanvasSelector: ".geetest_bg",
    gapCanvasSelector: ".geetest_slice_bg",
    successSelector: ".geetest_lock_success",
  };

  it("智能滑塊驗證", () => {
    const base = "swag.live";

    cy.intercept("GET", "https://pubsub.googleapis.com/*", (req) => {
      req.reply({
        statusCode: 204,
      });
    });

    cy.intercept("GET", `https://${base}/user/*`, (req) => {
      req.reply({
        statusCode: 204,
      });
    });

    cy.intercept("GET", `https://${base}/version`, (req) => {
      req.reply({
        statusCode: 204,
      });
    });

    cy.intercept("GET", `https://public.${base}/*`, (req) => {
      req.reply({
        statusCode: 204,
      });
    });
    cy.visit(config.testUrl, { timeout: 10000 });

    // 免費註冊登入的按鈕對應的class
    cy.get(".LandingContent__LoginRegisterButton-sc-68dc63b-7", {
      timeout: 10000,
    })
      .should("be.visible")
      .click({ force: true });
    cy.log("✓ 點擊登入");

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
