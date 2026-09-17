var jsPsychMouseReading = (function (jspsych) {
  'use strict';

  var version = "0.0.1";

  const info = {
    name: "mouse-reading",
    version,
    parameters: {
      /** Array that defines the size of the canvas element in pixels. First value is height, second value is width. */
      canvas_size: {
        type: jspsych.ParameterType.INT,
        array: true,
        default: [240, 500]
      },
      /** Presented text. Each different string in the array will become a separate button. */
      text_lines: {
        type: jspsych.ParameterType.STRING,
        default: [""],
        array: true
      },
      /** Diameter of the circular aperture,
       * width of the elliptical/rectangular/rounded rectangular aperture (unblurred view).
       * If aperture_gradient is specified,
       * the aperture_width corresponds to the distance to the midpoint (50% sharp view, 50% blurred view).
       * The "full", 100%-sharp view is smaller by 2 * aperture_gradient
       * (aperture_gradient on both sides).
       * The "partial", 0%-sharp view is larger by 2 * aperture_gradient
       * (aperture_gradient on both sides). */
      aperture_width: {
        type: jspsych.ParameterType.INT,
        default: 60
      },
      /** Height of the elliptical/rectangular/rounded rectangular aperture (unblurred view).
       * Default value (null) means the value of aperture_width will be used, resulting in a square shape. */
      aperture_height: {
        type: jspsych.ParameterType.INT,
        default: null
      },
      /** Radius of the corners in rounded rectangular aperture in pixels.
       * Default value (null) means the radius will be a half of height or width whichever is smaller. */
      aperture_corner_radius: {
        type: jspsych.ParameterType.INT,
        default: null
      },
      /** Shape of the aperture. Possible values: "circular", "rectangular", "roundrectangular", "elliptical". */
      aperture_shape: {
        type: jspsych.ParameterType.STRING,
        default: "circular"
      },
      /** Size of the gaussian gradient in pixels.
       * The distance from full sharp view to full blurred view is 2 * aperture_blur. */
      aperture_blur: {
        type: jspsych.ParameterType.INT,
        default: 0
      },
      /** Font family for the text */
      font_family: {
        type: jspsych.ParameterType.STRING,
        default: "monospace"
      },
      /** Font size for the text */
      font_size: {
        type: jspsych.ParameterType.STRING,
        default: "24px"
      },
      /** Font weight for the text */
      font_weight: {
        type: jspsych.ParameterType.STRING,
        default: "normal"
      },
      /** Font colour for the text, e.g. "black", "#4A90E2" or "rgb(74,144,226)" */
      font_colour: {
        type: jspsych.ParameterType.STRING,
        default: "black"
      },
      /** Vertical distance between text baselines in pixels. */
      line_height: {
        type: jspsych.ParameterType.INT,
        default: 32
      },
      /** Text rendering option, one of "auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision" */
      text_rendering: {
        type: jspsych.ParameterType.STRING,
        default: "auto"
      },
      /** Blur extent of the stimulus text in pixels. */
      text_blur: {
        type: jspsych.ParameterType.INT,
        default: 6
      },
      /** Coordinates of the text baseline in the format of [offsetX, offsetY]. */
      text_offset: {
        type: jspsych.ParameterType.INT,
        array: true,
        default: [20, 30]
      },
      /** Offset of the button center relative to the text baseline (text_offset).
       * Positive values represent shift left and up. */
      button_offset: {
        type: jspsych.ParameterType.INT,
        array: true,
        default: [10, 10]
      },
      /** Button diameter in pixels. */
      button_size: {
        type: jspsych.ParameterType.INT,
        default: 20
      },
      /** Distance from the button center in pixels when cursor becomes visible. */
      cursor_distance: {
        type: jspsych.ParameterType.INT,
        default: 20
      },
      /** Debugging option to display word boundaries in the sharp view. */
      show_segmentation: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      /** If true, image data in PNG format are returned for later analysis. */
      store_image_data: {
        type: jspsych.ParameterType.BOOL,
        default: true
      },
      /** Canvas colour */
      canvas_colour: {
        type: jspsych.ParameterType.STRING,
        default: "white"
      }
    },
    data: {
      /** The time when the start button was clicked, in milliseconds. */
      start_time: {
        type: jspsych.ParameterType.FLOAT
      },
      /** The time when the stop button was clicked, in milliseconds.
       * The time is relative to the start time, i.e. zero means stop button was clicked immediately after start button.*/
      finish_time: {
        type: jspsych.ParameterType.FLOAT
      },
      /** Array of mouse events. Times are relative to the start time (start button clicked). */
      mouse_data: {
        type: jspsych.ParameterType.OBJECT
      },
      /** Array of array of word coordinates. The top-level array corresponds to the text line, each array element on the second level correspons to one word.
       * The coordinates are relative to the canvas, i.e. same as the mouse data. */
      word_boxes: {
        type: jspsych.ParameterType.OBJECT
      },
      /** Provide a clear description of the data2 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
      rendered_text: {
        type: jspsych.ParameterType.STRING
      },
      /** Start button coordinates */
      start_button: {
        type: jspsych.ParameterType.FLOAT,
        array: true
      },
      /** Stop button coordinates */
      stop_button: {
        type: jspsych.ParameterType.FLOAT,
        array: true
      },
      /** The average frame rate for the trial, in ms. */
      frame_rate: {
        type: jspsych.ParameterType.FLOAT
      },
      /** The array of frame times in ms for the trial. */
      frame_rate_array: {
        type: jspsych.ParameterType.INT,
        array: true
      },
      /** The number of frames in the trial. */
      number_of_frames: {
        type: jspsych.ParameterType.INT
      }
    },
    // prettier-ignore
    citations: {
      "apa": "",
      "bibtex": ""
    }
  };
  class MouseReadingPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      let redraw = true;
      const apertureWidth = trial.aperture_width;
      const apertureHeight = trial.aperture_height ?? trial.aperture_width;
      const textBlur = trial.text_blur;
      const apertureBlur = trial.aperture_blur;
      const apertureCornerRadius = trial.aperture_corner_radius ?? Math.min(apertureHeight, apertureWidth) / 2;
      let lastX = -apertureWidth, lastY = -apertureHeight;
      performance.now();
      const canvasHeight = trial.canvas_size[0];
      const canvasWidth = trial.canvas_size[1];
      const canvasColour = trial.canvas_colour;
      const maskWidth = apertureWidth + apertureBlur * 2;
      const maskHeight = apertureHeight + apertureBlur * 2;
      let maskShape;
      if (trial.aperture_shape.toLowerCase().startsWith("circ")) maskShape = "circular";
      if (trial.aperture_shape.toLowerCase().startsWith("rect")) maskShape = "rectangular";
      if (trial.aperture_shape.toLowerCase().startsWith("round")) maskShape = "roundrectangular";
      if (trial.aperture_shape.toLowerCase().startsWith("el")) maskShape = "elliptical";
      const textOffsetX = trial.text_offset[0];
      const textOffsetY = trial.text_offset[1];
      let textFont = trial.font_weight + " " + trial.font_size + " " + trial.font_family;
      const buttonOffsets = [...trial.button_offset, ...trial.button_offset];
      const startOffsetX = buttonOffsets[0];
      const startOffsetY = buttonOffsets[1];
      const stopOffsetX = buttonOffsets[2];
      const stopOffsetY = buttonOffsets[3];
      const buttonRadius = trial.button_size / 2;
      const cursorDistance = trial.cursor_distance;
      let lastLineWidth = 0;
      let lastLineY = 0;
      let startButtonX = 0;
      let startButtonY = 0;
      let stopButtonX = 0;
      let stopButtonY = 0;
      var activeButtonX = -trial.canvas_size[0];
      var activeButtonY = -trial.canvas_size[1];
      var activeButtonRadius = buttonRadius;
      var waitingForStart = true;
      const hideCursor = true;
      var frameRequestID;
      var mouseData = [];
      let jsPsych = this.jsPsych;
      let wordBoxes = [];
      const showSegmentation = trial.show_segmentation;
      const storeImageData = trial.store_image_data;
      let imageData = "";
      let startTime;
      let stopTime;
      let timeZero;
      let frameRate;
      let frameRateArray;
      let numberOfFrames;
      const stimulusElement = document.createElement("div");
      stimulusElement.id = "jspsych-canvas-button-response-stimulus";
      const canvasShown = document.createElement("canvas");
      canvasShown.id = "jspsych-canvas-stimulus";
      canvasShown.height = canvasHeight;
      canvasShown.width = canvasWidth;
      canvasShown.style.display = "block";
      const canvasBlur = document.createElement("canvas");
      canvasBlur.height = canvasHeight;
      canvasBlur.width = canvasWidth;
      const canvasSharp = document.createElement("canvas");
      canvasSharp.height = canvasHeight;
      canvasSharp.width = canvasWidth;
      const canvasMask = document.createElement("canvas");
      canvasMask.height = maskHeight;
      canvasMask.width = maskWidth;
      const canvasTemporary = document.createElement("canvas");
      canvasMask.height = maskHeight;
      canvasMask.width = maskWidth;
      stimulusElement.appendChild(canvasShown);
      display_element.appendChild(stimulusElement);
      let ctx = canvasShown.getContext("2d");
      let ctxb = canvasBlur.getContext("2d");
      let ctxs = canvasSharp.getContext("2d");
      let ctxm = canvasMask.getContext("2d");
      let ctxt = canvasTemporary.getContext("2d");
      function draw_text(ctx2) {
        const lineHeight = trial.line_height;
        const lines = trial.text_lines;
        let x = textOffsetX;
        let y = textOffsetY;
        ctx2.font = textFont;
        ctx2.fillStyle = trial.font_colour;
        ctx2.textRendering = trial.text_rendering;
        for (const l of lines) {
          ctx2.fillText(l, x, y);
          y += lineHeight;
        }
      }
      function measure_text(ctx2) {
        const lineHeight = trial.line_height;
        const lines = trial.text_lines;
        let y = textOffsetY;
        ctx2.font = textFont;
        ctx2.fillStyle = trial.font_colour;
        ctx2.textRendering = trial.text_rendering;
        for (let i = 0; i < lines.length; i++) {
          let l = lines[i];
          let boundaries = findWordBoundaries(l);
          let wordStarts = boundaries.start;
          let wordEnds = boundaries.end;
          let wordBoxesOnLine = [];
          for (let i2 = 0; i2 < wordStarts.length; i2++) {
            let textBefore = l.slice(0, wordStarts[i2]);
            let textWord = l.slice(wordStarts[i2], wordEnds[i2]);
            let mText = ctx2.measureText(textBefore);
            let mWord = ctx2.measureText(textWord);
            let wordBox = wordCoordinates(textWord, mWord, textOffsetX + mText.width, y);
            wordBoxesOnLine.push(wordBox);
          }
          wordBoxes.push(wordBoxesOnLine);
          if (i == lines.length - 1) {
            lastLineY = y;
            let mText = ctx2.measureText(l);
            lastLineWidth = mText.width;
          }
          y += lineHeight;
        }
      }
      function wordCoordinates(word, measures, offX, offY) {
        let coords = {
          word,
          left: round2(offX),
          right: round2(offX + measures.width),
          width: round2(measures.width),
          height: round2(measures.fontBoundingBoxAscent + measures.fontBoundingBoxDescent),
          baseline: round2(offY),
          top: round2(offY - measures.fontBoundingBoxAscent),
          bottom: round2(offY + measures.fontBoundingBoxDescent)
        };
        return coords;
      }
      function round2(x) {
        return Math.round(x * 100) / 100;
      }
      function draw_target(ctx2, cx, cy, radius, color) {
        ctx2.beginPath();
        ctx2.fillStyle = color;
        ctx2.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx2.fill();
      }
      function drawImageCircularUsingMask(source, destination, sx, sy, dx, dy) {
        ctxt.globalCompositeOperation = "source-over";
        ctxt.fillStyle = canvasColour;
        ctxt.fillRect(0, 0, maskWidth, maskHeight);
        ctxt.drawImage(
          source.canvas,
          sx - maskWidth / 2,
          sy - maskHeight / 2,
          maskWidth,
          maskHeight,
          0,
          0,
          maskWidth,
          maskHeight
        );
        ctxt.globalCompositeOperation = "destination-in";
        ctxt.drawImage(canvasMask, 0, 0);
        destination.drawImage(
          ctxt.canvas,
          0,
          0,
          maskWidth,
          maskHeight,
          sx - maskWidth / 2,
          sy - maskHeight / 2,
          maskWidth,
          maskHeight
        );
      }
      function setupGraphics() {
        measure_text(ctx);
        updateButtonLocation();
        ctxb.filter = `blur(${textBlur}px)`;
        draw_text(ctxb);
        draw_target(ctxb, stopButtonX, stopButtonY, buttonRadius, "darkred");
        ctxb.filter = "none";
        draw_text(ctxs);
        draw_target(ctxs, stopButtonX, stopButtonY, buttonRadius, "darkred");
        if (showSegmentation) {
          drawWordBoxes(ctxs);
        }
        if (storeImageData) {
          imageData = canvasSharp.toDataURL("image/png");
        }
        switch (maskShape) {
          case "circular":
            prepareMaskCircular();
            break;
          case "rectangular":
            prepareMaskRectangular();
            break;
          case "roundrectangular":
            prepareMaskRoundRectangular();
            break;
          case "elliptical":
            prepareMaskElliptical();
            break;
        }
      }
      function prepareMaskCircular() {
        ctxm.fillStyle = "rgba(255,255,255,0)";
        ctxm.fillRect(0, 0, maskWidth, maskHeight);
        ctxm.filter = `blur(${apertureBlur}px)`;
        ctxm.fillStyle = "rgba(255,255,255,1)";
        ctxm.beginPath();
        ctxm.arc(maskWidth / 2, maskHeight / 2, apertureWidth / 2, 0, 2 * Math.PI, false);
        ctxm.fill();
        ctxm.filter = "none";
        ctxm.globalCompositeOperation = "source-over";
      }
      function prepareMaskElliptical() {
        ctxm.fillStyle = "rgba(255,255,255,0)";
        ctxm.fillRect(0, 0, maskWidth, maskHeight);
        ctxm.filter = `blur(${apertureBlur}px)`;
        ctxm.fillStyle = "rgba(255,255,255,1)";
        ctxm.beginPath();
        ctxm.ellipse(
          maskWidth / 2,
          maskHeight / 2,
          apertureWidth / 2,
          apertureHeight / 2,
          0,
          0,
          2 * Math.PI,
          false
        );
        ctxm.fill();
        ctxm.filter = "none";
        ctxm.globalCompositeOperation = "source-over";
      }
      function prepareMaskRectangular() {
        ctxm.fillStyle = "rgba(255,255,255,0)";
        ctxm.fillRect(0, 0, maskWidth, maskHeight);
        ctxm.filter = `blur(${apertureBlur}px)`;
        ctxm.fillStyle = "rgba(255,255,255,1)";
        ctxm.fillRect(apertureBlur, apertureBlur, apertureWidth, apertureHeight);
        ctxm.filter = "none";
        ctxm.globalCompositeOperation = "source-over";
      }
      function prepareMaskRoundRectangular() {
        ctxm.fillStyle = "rgba(255,255,255,0)";
        ctxm.fillRect(0, 0, maskWidth, maskHeight);
        ctxm.filter = `blur(${apertureBlur}px)`;
        ctxm.fillStyle = "rgba(255,255,255,1)";
        ctxm.beginPath();
        ctxm.roundRect(
          apertureBlur,
          apertureBlur,
          apertureWidth,
          apertureHeight,
          apertureCornerRadius
        );
        ctxm.fill();
        ctxm.filter = "none";
        ctxm.globalCompositeOperation = "source-over";
      }
      function animateMouseMotion() {
        frameRequestID = window.requestAnimationFrame(animate);
        function animate() {
          if (!waitingForStart) {
            // log only if the change is sufficiently large (for redraw)
            if (redraw) {
              logMouseEvent(lastX, lastY, performance.now() - startTime);
            }
          }
          if (redraw) {
            ctx.fillStyle = canvasColour;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            if (waitingForStart) {
              draw_target(ctx, startButtonX, startButtonY, buttonRadius, "green");
            } else {
              ctx.drawImage(ctxb.canvas, 0, 0);
              drawImageCircularUsingMask(ctxs, ctx, lastX, lastY);
            }
            redraw = false;
            performance.now();
          }
          frameRequestID = window.requestAnimationFrame(animate);
        }
      }
      function drawWordBoxes(ctx2) {
        let boxes = wordBoxes.flat();
        for (let i = 0; i < boxes.length; i++) {
          ctx2.strokeStyle = "#FF8888";
          ctx2.strokeRect(boxes[i].left, boxes[i].top, boxes[i].width, boxes[i].height);
        }
      }
      function activateStartButton() {
        activeButtonX = startButtonX;
        activeButtonY = startButtonY;
        activeButtonRadius = buttonRadius;
      }
      function activateStopButton() {
        activeButtonX = stopButtonX;
        activeButtonY = stopButtonY;
        activeButtonRadius = buttonRadius;
      }
      function updateButtonLocation() {
        startButtonX = textOffsetX - startOffsetX;
        startButtonY = textOffsetY - startOffsetY;
        stopButtonX = textOffsetX + lastLineWidth + stopOffsetX;
        stopButtonY = lastLineY - stopOffsetY;
      }
      function logMouseEvent(x, y, timestamp) {
        let eventRecord = { x, y, t: Math.round(timestamp) };
        mouseData.push(eventRecord);
      }
      function canvasMousePos(e, canvas) {
        const r = canvas.getBoundingClientRect();
        return {
          x: (e.clientX - r.left) * (canvas.width / r.width),
          y: (e.clientY - r.top) * (canvas.height / r.height)
        };
      }
      function onMove(event) {
        let e = canvasMousePos(event, canvasShown);
        let cx = Math.round(e.x), cy = Math.round(e.y);
        if (cx == lastX && cy == lastY) {
          redraw = false;
        } else {
          lastX = cx;
          lastY = cy;
          if (cx > -apertureWidth / 2 && cx < canvasWidth + apertureWidth / 2 && cy > -apertureHeight / 2 && cy < canvasHeight + apertureHeight / 2) {
            redraw = true;
          } else {
            redraw = false;
          }
          if (!waitingForStart && hideCursor) {
            let dx = cx - activeButtonX;
            let dy = cy - activeButtonY;
            let dd = Math.sqrt(dx * dx + dy * dy);
            if ((dd < cursorDistance) || (dx > 0)) {
              canvasShown.style.cursor = "pointer";
            } else {
              canvasShown.style.cursor = "none";
            }
          }
        }
      }
      function onMouseUp(event) {
        let e = canvasMousePos(event, canvasShown);
        let dx = e.x - activeButtonX;
        let dy = e.y - activeButtonY;
        let dd = Math.sqrt(dx * dx + dy * dy);
        let clicked = dd < activeButtonRadius;
        if (clicked) {
          if (waitingForStart) {
            waitingForStart = false;
            redraw = true;
            startTime = performance.now();
            activateStopButton();
          } else {
            end_trial();
          }
        }
      }
      setupGraphics();
      timeZero = performance.now();
      activateStartButton();
      animateMouseMotion();
      document.body.addEventListener("mousemove", onMove, false);
      document.body.addEventListener("touchstart", onMove, false);
      document.body.addEventListener("touchmove", onMove, false);
      document.body.addEventListener("mouseup", onMouseUp, false);
      var trial_data = {
        word_boxes: wordBoxes,
        image_data: imageData,
        mouse_data: mouseData,
        start_time: -1,
        stop_time: -1,
        ifi_times: [],
        //
        start_button: [startButtonX, startButtonY],
        stop_button: [stopButtonX, stopButtonY],
        frame_rate: null,
        frame_rate_array: [],
        number_of_frames: 0
      };
      function end_trial() {
        stopTime = performance.now();
        window.cancelAnimationFrame(frameRequestID);
        document.removeEventListener("mousemove", onMove, false);
        document.removeEventListener("touchstart", onMove, false);
        document.removeEventListener("touchmove", onMove, false);
        document.removeEventListener("mouseup", onMouseUp, false);
        trial_data.start_time = startTime - timeZero;
        trial_data.stop_time = stopTime - timeZero;
        calculateInterFrameIntervals();
        trial_data.frame_rate = frameRate;
        trial_data.frame_rate_array = []; // frameRateArray;
        trial_data.number_of_frames = numberOfFrames;
        jsPsych.finishTrial(trial_data);
      }
      function findWordBoundaries(sentence) {
        let startPositions = [];
        let endPositions = [];
        let wordStarted = false;
        for (let i = 0; i < sentence.length; i++) {
          if (sentence[i] == " ") {
            if (wordStarted) {
              wordStarted = false;
              endPositions.push(i);
            }
          } else {
            if (!wordStarted) {
              wordStarted = true;
              startPositions.push(i);
            }
          }
        }
        if (wordStarted) endPositions.push(sentence.length);
        return { start: startPositions, end: endPositions };
      }
      function calculateInterFrameIntervals() {
        frameRateArray = [];
        let lastTime = 0;
        for (let i = 0; i < mouseData.length; i++) {
          frameRateArray.push(mouseData[i].t - lastTime);
          lastTime = mouseData[i].t;
        }
        numberOfFrames = frameRateArray.length;
        if (numberOfFrames > 0) {
          frameRate = frameRateArray.reduce((total, current) => total + current) / numberOfFrames;
        } else {
          frameRate = 0;
        }
      }
    }
  }

  return MouseReadingPlugin;

})(jsPsychModule);
//# sourceMappingURL=index.browser.js.map
