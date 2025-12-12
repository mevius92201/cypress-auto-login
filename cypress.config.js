const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    screenshotOnRunFailure: false,
    cacheAcrossSpecs: true,

    setupNodeEvents(on, config) {
      on("task", {
        readOpenCV() {
          const fs = require("fs");
          const path = require("path");
          const opencvPath = path.join(
            __dirname,
            "cypress/support/libs/opencv.js"
          );
          try {
            const content = fs.readFileSync(opencvPath, "utf-8");
            return content;
          } catch (error) {
            return null;
          }
        },
      });

      return config;
    },
  },
});
