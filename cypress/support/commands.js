function generateBezierPath(startX, startY, endX, endY, numPoints = 50) {
  const path = [];
  const controlPoint1X = startX + (endX - startX) * (0.3 + Math.random() * 0.2);
  const controlPoint1Y =
    startY +
    (endY - startY) *
      (0.2 + Math.random() * 0.3) *
      (Math.random() > 0.5 ? 1 : -1);
  const controlPoint2X = startX + (endX - startX) * (0.6 + Math.random() * 0.2);
  const controlPoint2Y =
    startY +
    (endY - startY) *
      (0.3 + Math.random() * 0.4) *
      (Math.random() > 0.5 ? 1 : -1);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x =
      Math.pow(1 - t, 3) * startX +
      3 * Math.pow(1 - t, 2) * t * controlPoint1X +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2X +
      Math.pow(t, 3) * endX;
    const y =
      Math.pow(1 - t, 3) * startY +
      3 * Math.pow(1 - t, 2) * t * controlPoint1Y +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2Y +
      Math.pow(t, 3) * endY;
    path.push({ x: Math.round(x), y: Math.round(y), t });
  }

  return path;
}

Cypress.Commands.add(
  'slideWithBezier',
  (sliderSelector, distance, duration = null) => {
    cy.get(sliderSelector).then(($slider) => {
      const actualDuration = duration || 1000 + Math.random() * 500;
      const rect = $slider[0].getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      const endX = startX + distance;
      const endY = startY + (Math.random() * 4 - 2);

      const path = generateBezierPath(startX, startY, endX, endY, 50);

      $slider[0].dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: startX,
          clientY: startY,
          button: 0,
        })
      );

      path.forEach((point, index) => {
        setTimeout(() => {
          $slider[0].dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              clientX: point.x,
              clientY: point.y,
              button: 0,
            })
          );

          if (index === path.length - 1) {
            setTimeout(() => {
              $slider[0].dispatchEvent(
                new MouseEvent('mouseup', {
                  bubbles: true,
                  cancelable: true,
                  clientX: point.x,
                  clientY: point.y,
                  button: 0,
                })
              );
            }, 50);
          }
        }, (actualDuration / path.length) * index);
      });
    });

    cy.wait(duration || 2000);
  }
);

Cypress.Commands.add(
  'detectSliderGapWithOpenCV',
  (bgImageSelector, gapImageSelector) => {
    cy.window().then((win) => {
      if (!win.cv || !win.cv.imread) {
        cy.task('readOpenCV').then((opencvCode) => {
          if (opencvCode) {
            const script = win.document.createElement('script');
            script.textContent = opencvCode;
            win.document.head.appendChild(script);
          }
        });
      }
    });

    cy.wait(1000);

    cy.window().then((win) => {
      if (!win.cv || !win.cv.imread) {
        throw new Error('OpenCV 初始化失敗');
      }
    });

    cy.window().then((win) => {
      return cy.get(bgImageSelector).then(($bgEl) => {
        return cy.get(gapImageSelector).then(($gapEl) => {
          const extractImageUrl = (element) => {
            const style = win.getComputedStyle(element);
            const backgroundImage = style.backgroundImage;
            const urlMatch = backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
            if (!urlMatch || !urlMatch[1]) {
              throw new Error('無法提取圖片 URL');
            }
            return urlMatch[1];
          };

          const bgUrl = extractImageUrl($bgEl[0]);
          const gapUrl = extractImageUrl($gapEl[0]);

          const loadImage = (url) => {
            return new Promise((resolve, reject) => {
              const img = new win.Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error(`圖片載入失敗: ${url}`));
              img.src = url;
            });
          };

          return cy
            .wrap(Promise.all([loadImage(bgUrl), loadImage(gapUrl)]))
            .then(([bgImg, gapImg]) => {
              const src = win.cv.imread(bgImg);
              const template = win.cv.imread(gapImg);

              const clearWhite = (img) => {
                const gray = new win.cv.Mat();
                win.cv.cvtColor(img, gray, win.cv.COLOR_RGBA2GRAY);
                const binary = new win.cv.Mat();
                win.cv.threshold(
                  gray,
                  binary,
                  250,
                  255,
                  win.cv.THRESH_BINARY_INV
                );
                const rect = win.cv.boundingRect(binary);
                gray.delete();
                binary.delete();
                if (rect.width > 0 && rect.height > 0) {
                  return img.roi(rect);
                }
                return img;
              };

              const templateCropped = clearWhite(template);

              const grayTemplate = new win.cv.Mat();
              const graySrc = new win.cv.Mat();
              win.cv.cvtColor(
                templateCropped,
                grayTemplate,
                win.cv.COLOR_RGBA2GRAY
              );
              win.cv.cvtColor(src, graySrc, win.cv.COLOR_RGBA2GRAY);

              const blurTemplate = new win.cv.Mat();
              const blurSrc = new win.cv.Mat();
              win.cv.GaussianBlur(
                grayTemplate,
                blurTemplate,
                new win.cv.Size(5, 5),
                0
              );
              win.cv.GaussianBlur(graySrc, blurSrc, new win.cv.Size(5, 5), 0);

              const edgesTemplate = new win.cv.Mat();
              const edgesSrc = new win.cv.Mat();
              win.cv.Canny(blurTemplate, edgesTemplate, 50, 150);
              win.cv.Canny(blurSrc, edgesSrc, 50, 150);

              const kernel = win.cv.getStructuringElement(
                win.cv.MORPH_RECT,
                new win.cv.Size(3, 3)
              );
              win.cv.morphologyEx(
                edgesTemplate,
                edgesTemplate,
                win.cv.MORPH_CLOSE,
                kernel
              );
              win.cv.morphologyEx(
                edgesSrc,
                edgesSrc,
                win.cv.MORPH_CLOSE,
                kernel
              );

              const result = new win.cv.Mat();
              win.cv.matchTemplate(
                edgesSrc,
                edgesTemplate,
                result,
                win.cv.TM_CCOEFF_NORMED
              );

              const minMax = win.cv.minMaxLoc(result);
              const gapX = minMax.maxLoc.x;

              src.delete();
              template.delete();
              templateCropped.delete();
              grayTemplate.delete();
              graySrc.delete();
              blurTemplate.delete();
              blurSrc.delete();
              edgesTemplate.delete();
              edgesSrc.delete();
              kernel.delete();
              result.delete();

              return gapX;
            });
        });
      });
    });
  }
);

Cypress.Commands.add(
  'smartSlideVerification',
  (sliderSelector, bgCanvasSelector, gapCanvasSelector, options = {}) => {
    const { offset = 0, duration = null } = options;
    cy.detectSliderGapWithOpenCV(bgCanvasSelector, gapCanvasSelector).then(
      (gapX) => {
        cy.slideWithBezier(sliderSelector, gapX + offset, duration);
      }
    );
  }
);
