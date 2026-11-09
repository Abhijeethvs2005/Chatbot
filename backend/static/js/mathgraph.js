/**
 * NOVA Math & Function Plotter
 * Real-time KaTeX LaTeX equation rendering & Interactive 2D canvas function grapher.
 */

class MathGrapher {
  /**
   * Render LaTeX equations in a DOM element using KaTeX
   */
  static renderMath(element) {
    if (!element) return;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(element, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX rendering error:", e);
      }
    }
  }

  /**
   * Plot an interactive mathematical function on a canvas
   */
  static plotFunction(canvas, fnString, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const xMin = options.xMin || -6;
    const xMax = options.xMax || 6;
    const yMin = options.yMin || -4;
    const yMax = options.yMax || 4;
    const color = options.color || "#38bdf8";
    const label = options.label || "f(x)";

    // Clean canvas
    ctx.clearRect(0, 0, width, height);

    // Dark sleek student graph paper background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Grid coordinates conversion
    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw Gridlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }

    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1.5;

    // X-Axis
    const cyZero = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, cyZero);
    ctx.lineTo(width, cyZero);
    ctx.stroke();

    // Y-Axis
    const cxZero = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(cxZero, 0);
    ctx.lineTo(cxZero, height);
    ctx.stroke();

    // Safe mathematical function evaluator
    let evaluateFn;
    try {
      evaluateFn = new Function("x", `with(Math) { return ${fnString}; }`);
    } catch (e) {
      console.warn("Invalid function expression:", fnString);
      return;
    }

    // Plot Function Curve
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    let started = false;
    const step = (xMax - xMin) / (width * 1.5);

    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y = evaluateFn(x);
        if (typeof y === "number" && !isNaN(y) && isFinite(y)) {
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);

          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          started = false;
        }
      } catch (e) {
        started = false;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Label and Legend
    ctx.fillStyle = "#f8fafc";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`${label}`, 14, 24);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.fillText(`x: [${xMin}, ${xMax}]`, width - 80, height - 12);
  }
}

window.MathGrapher = MathGrapher;
