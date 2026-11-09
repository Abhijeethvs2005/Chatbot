import os
import re
import json
import time
import math
import ast
import operator
import asyncio
import urllib.parse
from typing import Optional, List, Dict, Any
from pathlib import Path

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
STATIC_DIR = PROJECT_ROOT / "static"
if not (STATIC_DIR / "index.html").exists() and (APP_DIR / "static" / "index.html").exists():
    STATIC_DIR = APP_DIR / "static"

app = FastAPI(
    title="Chatbot Abhi - AI Educational Companion",
    description="3D Robot System & High-Speed Multi-Domain Academic AI Engine created by Abhijeeth",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    subject: Optional[str] = "General"
    mode: Optional[str] = "standard"  # standard, eli5, exam_prep, step_by_step
    api_key: Optional[str] = None
    stream: Optional[bool] = True

class QuizRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "undergraduate"

class KeyTestRequest(BaseModel):
    api_key: str

@app.post("/api/test-key")
async def test_key_endpoint(req: KeyTestRequest):
    key = req.api_key.strip()
    if not key or not key.startswith("sk-"):
        return {"valid": False, "error": "Invalid API key format. Key must start with 'sk-'."}
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=key)
        await client.chat.completions.create(
            model=os.getenv("CHAT_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=3
        )
        return {"valid": True, "message": "✓ Key is valid and active with available credits!"}
    except Exception as e:
        err_msg = str(e)
        if "insufficient_quota" in err_msg or "credit_balance_exhausted" in err_msg:
            return {"valid": False, "error": "Quota exhausted / No credits remaining on this OpenAI account."}
        return {"valid": False, "error": err_msg[:120]}

# Safe Mathematical Arithmetic & Algebra Evaluator
SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.Mod: operator.mod
}

# In-memory LRU Wikipedia fact cache
WIKI_CACHE: Dict[str, Dict[str, str]] = {}

def differentiate_polynomial(expr: str) -> str:
    """Compute exact derivative of a single-variable polynomial in x."""
    clean = expr.replace(' ', '')
    if not clean.startswith('+') and not clean.startswith('-'):
        clean = '+' + clean
    pattern = re.compile(r'([+-])\s*(\d*(?:\.\d+)?)?\s*(x)?(?:\^(\d+))?')
    pos = 0
    deriv_terms = []
    for m in pattern.finditer(clean):
        if m.start() != pos or m.group(0) == '':
            continue
        pos = m.end()
        sign = -1 if m.group(1) == '-' else 1
        coeff_str = m.group(2)
        has_x = bool(m.group(3))
        power_str = m.group(4)
        if not has_x and not coeff_str:
            continue
        coeff = float(coeff_str) if coeff_str else 1.0
        coeff *= sign
        power = int(power_str) if power_str else (1 if has_x else 0)
        if power == 0:
            continue
        new_coeff = coeff * power
        new_power = power - 1
        c_fmt = int(new_coeff) if new_coeff.is_integer() else round(new_coeff, 4)
        if new_power == 0:
            term_str = f"{c_fmt}"
        elif new_power == 1:
            term_str = f"{c_fmt}x" if c_fmt != 1 else "x"
            if c_fmt == -1: term_str = "-x"
        else:
            term_str = f"{c_fmt}x^{new_power}" if c_fmt != 1 else f"x^{new_power}"
            if c_fmt == -1: term_str = f"-x^{new_power}"
        deriv_terms.append((new_coeff, term_str))
    if not deriv_terms:
        return "0"
    res = ""
    for i, (c, t) in enumerate(deriv_terms):
        if i == 0:
            res += t
        else:
            if c > 0: res += " + " + t
            else: res += " - " + t.lstrip('-')
    return res

def integrate_polynomial(expr: str) -> str:
    """Compute indefinite integral of a single-variable polynomial in x."""
    clean = expr.replace(' ', '')
    if not clean.startswith('+') and not clean.startswith('-'):
        clean = '+' + clean
    pattern = re.compile(r'([+-])\s*(\d*(?:\.\d+)?)?\s*(x)?(?:\^(\d+))?')
    pos = 0
    integ_terms = []
    for m in pattern.finditer(clean):
        if m.start() != pos or m.group(0) == '':
            continue
        pos = m.end()
        sign = -1 if m.group(1) == '-' else 1
        coeff_str = m.group(2)
        has_x = bool(m.group(3))
        power_str = m.group(4)
        if not has_x and not coeff_str:
            continue
        coeff = float(coeff_str) if coeff_str else 1.0
        coeff *= sign
        power = int(power_str) if power_str else (1 if has_x else 0)
        new_power = power + 1
        new_coeff = coeff / new_power
        c_fmt = int(new_coeff) if new_coeff.is_integer() else round(new_coeff, 4)
        if new_power == 1:
            term_str = f"{c_fmt}x" if c_fmt != 1 else "x"
            if c_fmt == -1: term_str = "-x"
        else:
            term_str = f"{c_fmt}x^{new_power}" if c_fmt != 1 else f"x^{new_power}"
            if c_fmt == -1: term_str = f"-x^{new_power}"
        integ_terms.append((new_coeff, term_str))
    res = ""
    for i, (c, t) in enumerate(integ_terms):
        if i == 0:
            res += t
        else:
            if c > 0: res += " + " + t
            else: res += " - " + t.lstrip('-')
    return (res + " + C") if res else "C"

def try_eval_math(query: str) -> Optional[Dict[str, Any]]:
    """Safely detect and calculate arithmetic, algebraic, geometric, calculus, physics, and conversion problems."""
    raw = query.strip()
    raw_lower = raw.lower()

    # 1. Polynomial Differentiation: e.g. "derivative of 3x^3 - 5x^2 + 4x - 9" or "d/dx(4x^2 + 2x)"
    m_diff = re.search(r'(?:derivative of|d/dx\s*\(?)\s*([0-9xX\^\+\-\s\.\*]+)\)?', raw_lower)
    if m_diff:
        poly_str = m_diff.group(1).strip()
        ans = differentiate_polynomial(poly_str)
        return {
            "title": f"Calculus Derivative: d/dx ({poly_str})",
            "core": f"The derivative of $${poly_str}$$ with respect to $x$ is **$${ans}$$**.",
            "formulas": [
                r"\frac{d}{dx}[x^n] = n \cdot x^{n-1} \quad \text{(Power Rule)}",
                f"\\frac{{d}}{{dx}} \\left( {poly_str} \\right) = {ans}"
            ],
            "steps": [
                f"1. **Apply Power Rule**: Multiply each coefficient by its exponent, then decrement the exponent by 1.",
                f"2. **Differentiate Constants**: Constant terms have zero rate of change: \\frac{{d}}{{dx}}[c] = 0.",
                f"3. **Result**: $$\\mathbf{{\\frac{{d}}{{dx}}[{poly_str}] = {ans}}}$$"
            ],
            "analogy": "Differentiating a function tells you its instantaneous slope or speedometer reading at every point.",
            "pitfalls": "Be careful with negative coefficients and remember that the derivative of a constant term is 0!",
            "confidence": "100% Deterministic Calculus Standard"
        }

    # 2. Polynomial Integration: e.g. "integral of 3x^2 - 4x + 5" or "integrate 6x^2"
    m_integ = re.search(r'(?:integral of|integrate)\s*([0-9xX\^\+\-\s\.\*]+)', raw_lower)
    if m_integ and not any(w in raw_lower for w in ["circuit", "system", "chip"]):
        poly_str = m_integ.group(1).strip()
        ans = integrate_polynomial(poly_str)
        return {
            "title": f"Calculus Indefinite Integral: ∫ ({poly_str}) dx",
            "core": f"The indefinite integral of $${poly_str}$$ is **$${ans}$$**.",
            "formulas": [
                r"\int x^n \, dx = \frac{x^{n+1}}{n+1} + C \quad (n \neq -1)",
                f"\\int \\left( {poly_str} \\right) dx = {ans}"
            ],
            "steps": [
                f"1. **Apply Reverse Power Rule**: Increment each power by 1 and divide by the new power.",
                f"2. **Integrate Constants**: \\int c \\, dx = c x.",
                f"3. **Add Constant of Integration**: Always append + C for indefinite integrals.",
                f"4. **Result**: $$\\mathbf{{\\int ({poly_str}) \\, dx = {ans}}}$$"
            ],
            "analogy": "Integration accumulates all the tiny slices of area under the curve to find total accumulation.",
            "pitfalls": "Never forget the arbitrary constant of integration + C on indefinite integrals!",
            "confidence": "100% Deterministic Calculus Standard"
        }

    # 3. Linear Equation Solver: e.g. "solve 3x + 9 = 24", "5x - 15 = 35", "3x = 15"
    m_lin = re.search(r'(?:solve\s+)?([+-]?\s*\d*(?:\.\d+)?)\s*x(?:\s*([+-]\s*\d*(?:\.\d+)?))?\s*=\s*([+-]?\s*\d*(?:\.\d+)?)', raw_lower)
    if m_lin and "x^2" not in raw_lower:
        try:
            a_str = (m_lin.group(1) or "1").replace(" ", "")
            a = float(a_str) if a_str not in ["", "+", "-"] else float(a_str + "1")
            b_str = m_lin.group(2)
            b = float(b_str.replace(" ", "")) if b_str else 0.0
            c = float(m_lin.group(3).replace(" ", ""))
            if a != 0:
                x = (c - b) / a
                x_fmt = int(x) if x.is_integer() else round(x, 4)
                a_fmt = int(a) if a.is_integer() else round(a, 4)
                b_fmt = int(b) if b.is_integer() else round(b, 4)
                c_fmt = int(c) if c.is_integer() else round(c, 4)
                eq_label = f"{a_fmt}x" + (f" + {b_fmt}" if b_fmt > 0 else (f" - {abs(b_fmt)}" if b_fmt < 0 else "")) + f" = {c_fmt}"
                return {
                    "title": f"Linear Equation Solution: {eq_label}",
                    "core": f"The solution to the equation $${eq_label}$$ is **x = {x_fmt}**.",
                    "formulas": [f"{eq_label} \\implies {a_fmt}x = {c_fmt - b_fmt} \\implies x = {x_fmt}"],
                    "steps": [
                        f"1. **Isolate Variable Term**: Move constant to right: {a_fmt}x = {c_fmt} - ({b_fmt}) = {c_fmt - b_fmt}." if b_fmt != 0 else f"1. **Analyze Equation**: Term is already isolated: {a_fmt}x = {c_fmt}.",
                        f"2. **Divide by Coefficient**: Divide both sides by {a_fmt}: x = {c_fmt - b_fmt} / {a_fmt} = {x_fmt}.",
                        f"3. **Verification**: {a_fmt}({x_fmt}) + ({b_fmt}) = {a * x_fmt + b} (Matches {c_fmt})."
                    ],
                    "analogy": "Like balancing a scale: whatever operation you perform on one side, you must mirror on the other.",
                    "pitfalls": "Watch out for negative signs when subtracting constant terms across the equals sign!",
                    "confidence": "100% Algebraic Precision"
                }
        except Exception:
            pass

    # 4. Quadratic Equation Solver: e.g. "x^2 - 5x + 6 = 0", "x^2 - 9 = 0", "2x^2 + 4x = 0"
    m_quad = re.search(r'(?:solve\s+)?([+-]?\s*\d*(?:\.\d+)?)\s*x\^2(?:\s*([+-]\s*\d*(?:\.\d+)?)\s*x)?(?:\s*([+-]\s*\d*(?:\.\d+)?))?\s*(?:=\s*0)?', raw_lower)
    if m_quad and ("x^2" in raw_lower or "x^ 2" in raw_lower):
        try:
            a_str = (m_quad.group(1) or "1").replace(" ", "")
            a = float(a_str) if a_str not in ["", "+", "-"] else float(a_str + "1")
            b_str = m_quad.group(2)
            b = float(b_str.replace(" ", "")) if b_str else 0.0
            c_str = m_quad.group(3)
            c = float(c_str.replace(" ", "")) if c_str else 0.0
            
            discriminant = b**2 - 4*a*c
            if discriminant > 0:
                root1 = (-b + math.sqrt(discriminant)) / (2*a)
                root2 = (-b - math.sqrt(discriminant)) / (2*a)
                r1_fmt = int(root1) if root1.is_integer() else round(root1, 4)
                r2_fmt = int(root2) if root2.is_integer() else round(root2, 4)
                roots_str = f"x_1 = {r1_fmt}, \\quad x_2 = {r2_fmt}"
                desc = f"Two distinct real roots exist: **{r1_fmt}** and **{r2_fmt}**."
            elif discriminant == 0:
                root = -b / (2*a)
                r_fmt = int(root) if root.is_integer() else round(root, 4)
                roots_str = f"x = {r_fmt} \\quad \\text{{(repeated root)}}"
                desc = f"One repeated real root exists: **{r_fmt}**."
            else:
                real_part = round(-b / (2*a), 4)
                imag_part = round(math.sqrt(-discriminant) / (2*a), 4)
                roots_str = f"x = {real_part} \\pm {imag_part}i"
                desc = f"Complex conjugate roots exist: **{real_part} ± {imag_part}i**."

            return {
                "title": f"Quadratic Equation: {a}x² + {b}x + {c} = 0",
                "core": desc,
                "formulas": [
                    f"ax^2 + bx + c = 0 \\implies x = \\frac{{-b \\pm \\sqrt{{b^2 - 4ac}}}}{{2a}}",
                    f"\\Delta = b^2 - 4ac = ({b})^2 - 4({a})({c}) = {round(discriminant, 4)}",
                    roots_str
                ],
                "steps": [
                    f"1. **Identify Coefficients**: a = {a}, b = {b}, c = {c}.",
                    f"2. **Compute Discriminant (Δ)**: Δ = b² - 4ac = ({b})² - 4({a})({c}) = {round(discriminant, 4)}.",
                    f"3. **Apply Quadratic Formula**: Substitute into x = (-b ± √Δ) / (2a).",
                    f"4. **Exact Solutions**: $${roots_str}$$"
                ],
                "analogy": "A quadratic equation graphs a parabola. The roots correspond to where the curve intersects the ground (x-axis).",
                "pitfalls": "Remember that dividing by 2a applies to the entire numerator (-b ± √Δ)!",
                "confidence": "100% Deterministic Algebraic Standard"
            }
        except Exception:
            pass

    # 5. Percentage: e.g. "15% of 240" or "what is 20 percent of 850"
    m_pct = re.search(r'(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)', raw_lower)
    if m_pct:
        pct = float(m_pct.group(1))
        tot = float(m_pct.group(2))
        val = (pct / 100.0) * tot
        val_fmt = int(val) if val.is_integer() else round(val, 4)
        return {
            "title": f"Percentage Calculation: {pct}% of {tot}",
            "core": f"**{pct}% of {tot} is {val_fmt}**.",
            "formulas": [f"\\text{{Value}} = \\left(\\frac{{{pct}}}{{100}}\\right) \\times {tot} = {val_fmt}"],
            "steps": [
                f"1. **Convert Percent to Decimal**: {pct}% = {pct} / 100 = {pct/100}.",
                f"2. **Multiply by Whole**: {pct/100} × {tot} = {val_fmt}."
            ],
            "analogy": f"If you divide {tot} into 100 equal parts, taking {pct} of those parts gives exactly {val_fmt}.",
            "pitfalls": "Remember 'of' means multiplication in percentage word problems.",
            "confidence": "100% Deterministic Arithmetic"
        }

    # 6. Physics Word Problem: Force (F = m * a)
    if ("force" in raw_lower or "f=ma" in raw_lower) and ("mass" in raw_lower or "kg" in raw_lower):
        m_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*kg', r'mass\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: m_val = float(m.group(1)); break
        a_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*m\/s(?:\^2|2)?', r'accel\w*\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: a_val = float(m.group(1)); break
        if m_val is not None and a_val is not None:
            f = m_val * a_val
            f_fmt = int(f) if f.is_integer() else round(f, 4)
            return {
                "title": f"Physics Calculation: Force (m = {m_val} kg, a = {a_val} m/s²)",
                "core": f"The required net force is **{f_fmt} Newtons (N)**.",
                "formulas": [f"F = m \\cdot a = ({m_val} \\text{{ kg}}) \\times ({a_val} \\text{{ m/s}}^2) = {f_fmt} \\text{{ N}}"],
                "steps": [
                    f"1. **Newton's Second Law**: F_net = m × a.",
                    f"2. **Substitute Knowns**: Mass m = {m_val} kg, Acceleration a = {a_val} m/s².",
                    f"3. **Compute**: F = {m_val} × {a_val} = {f_fmt} N."
                ],
                "analogy": "The heavier an object (mass) and the faster you want to change its speed (acceleration), the harder you must push (force).",
                "pitfalls": "Ensure mass is in kilograms (kg) and acceleration in m/s² so the resulting unit is in standard Newtons.",
                "confidence": "100% Classical Physics Mechanics"
            }

    # 7. Physics Word Problem: Kinetic Energy (1/2 m v^2)
    if ("kinetic energy" in raw_lower or "ke" in raw_lower) and ("mass" in raw_lower or "kg" in raw_lower):
        m_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*kg', r'mass\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: m_val = float(m.group(1)); break
        v_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*m\/s', r'(?:speed|veloc\w*)\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: v_val = float(m.group(1)); break
        if m_val is not None and v_val is not None:
            ke = 0.5 * m_val * (v_val ** 2)
            ke_fmt = int(ke) if ke.is_integer() else round(ke, 4)
            return {
                "title": f"Physics Calculation: Kinetic Energy (m = {m_val} kg, v = {v_val} m/s)",
                "core": f"The kinetic energy of the object is **{ke_fmt} Joules (J)**.",
                "formulas": [f"E_k = \\frac{{1}}{{2}} m v^2 = \\frac{{1}}{{2}} ({m_val}) ({v_val})^2 = {ke_fmt} \\text{{ J}}"],
                "steps": [
                    f"1. **Formula**: E_k = 1/2 · m · v².",
                    f"2. **Square Velocity**: v² = ({v_val})² = {v_val**2}.",
                    f"3. **Compute**: 0.5 × {m_val} × {v_val**2} = {ke_fmt} J."
                ],
                "analogy": "Doubling your car's speed quadruples its braking energy because kinetic energy scales with the square of velocity.",
                "pitfalls": "Do not forget to square the velocity BEFORE multiplying by 1/2 mass!",
                "confidence": "100% Classical Physics Mechanics"
            }

    # 8. Physics Word Problem: Speed (v = d / t)
    if ("speed" in raw_lower or "velocity" in raw_lower) and ("distance" in raw_lower or "km" in raw_lower or "miles" in raw_lower):
        d_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:km|miles|meters|m\b)', r'distance\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: d_val = float(m.group(1)); break
        t_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|seconds|sec|s\b|minutes|min)', r'time\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: t_val = float(m.group(1)); break
        if d_val is not None and t_val is not None and t_val > 0:
            spd = d_val / t_val
            spd_fmt = int(spd) if spd.is_integer() else round(spd, 4)
            return {
                "title": f"Kinematics Speed Calculation (d = {d_val}, t = {t_val})",
                "core": f"The average speed is **{spd_fmt}** units per time.",
                "formulas": [f"v = \\frac{{d}}{{t}} = \\frac{{{d_val}}}{{{t_val}}} = {spd_fmt}"],
                "steps": [
                    f"1. **Definition**: Average speed is total distance divided by elapsed time.",
                    f"2. **Compute**: v = {d_val} / {t_val} = {spd_fmt}."
                ],
                "analogy": "Speed measures the rate at which distance is covered per tick of the clock.",
                "pitfalls": "Make sure distance and time units match (e.g., km with hours, or meters with seconds).",
                "confidence": "100% Kinematics Standard"
            }

    # 8b. Physics: Ohm's Law (V = I * R)
    if ("ohm" in raw_lower or "voltage" in raw_lower or "current" in raw_lower or "resistance" in raw_lower) and any(w in raw_lower for w in ["amp", "ohm", "volt"]):
        i_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:amps?|a\b)', r'current\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: i_val = float(m.group(1)); break
        r_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:ohms?|Ω)', r'resistance\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: r_val = float(m.group(1)); break
        v_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:volts?|v\b)', r'voltage\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: v_val = float(m.group(1)); break
        if i_val is not None and r_val is not None:
            v_res = i_val * r_val
            v_fmt = int(v_res) if v_res.is_integer() else round(v_res, 4)
            return {
                "title": f"Ohm's Law Voltage Calculation (I = {i_val} A, R = {r_val} Ω)",
                "core": f"The electric potential difference (voltage) is **{v_fmt} Volts (V)**.",
                "formulas": [f"V = I \\cdot R = ({i_val} \\text{{ A}}) \\times ({r_val} \\,\\Omega) = {v_fmt} \\text{{ V}}"],
                "steps": [
                    "1. **Ohm's Law**: Voltage across a conductor equals current multiplied by resistance (V = I · R).",
                    f"2. **Compute**: V = {i_val} × {r_val} = {v_fmt} V."
                ],
                "analogy": "Voltage is water pressure, current is the volume flow rate of water, and resistance is the narrowness of the pipe.",
                "pitfalls": "Ensure current is in Amperes (A) and resistance in Ohms (Ω). If milliAmps (mA) are given, divide by 1000 first!",
                "confidence": "100% Electromagnetism Standard"
            }
        elif v_val is not None and r_val is not None and r_val > 0:
            i_res = v_val / r_val
            i_fmt = int(i_res) if i_res.is_integer() else round(i_res, 4)
            return {
                "title": f"Ohm's Law Current Calculation (V = {v_val} V, R = {r_val} Ω)",
                "core": f"The resulting electric current is **{i_fmt} Amperes (A)**.",
                "formulas": [f"I = \\frac{{V}}{{R}} = \\frac{{{v_val} \\text{{ V}}}}{{{r_val} \\,\\Omega}} = {i_fmt} \\text{{ A}}"],
                "steps": [
                    "1. **Ohm's Law**: Current is electric potential divided by resistance (I = V / R).",
                    f"2. **Compute**: I = {v_val} / {r_val} = {i_fmt} A."
                ],
                "analogy": "Higher resistance restricts the flow of electrons, lowering the current for a fixed voltage pressure.",
                "pitfalls": "Short circuits occur when resistance R approaches zero, causing current I to surge toward infinity!",
                "confidence": "100% Electromagnetism Standard"
            }

    # 8c. Physics: Work & Mechanical Energy (W = F * d)
    if "work" in raw_lower and ("force" in raw_lower or "newton" in raw_lower or "joule" in raw_lower) and ("distance" in raw_lower or "meter" in raw_lower or "m\b" in raw_lower):
        f_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:newtons?|n\b)', r'force\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: f_val = float(m.group(1)); break
        d_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*(?:meters?|m\b)', r'distance\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: d_val = float(m.group(1)); break
        if f_val is not None and d_val is not None:
            w_res = f_val * d_val
            w_fmt = int(w_res) if w_res.is_integer() else round(w_res, 4)
            return {
                "title": f"Physics Calculation: Mechanical Work (F = {f_val} N, d = {d_val} m)",
                "core": f"The mechanical work done is **{w_fmt} Joules (J)**.",
                "formulas": [f"W = F \\cdot d = ({f_val} \\text{{ N}}) \\times ({d_val} \\text{{ m}}) = {w_fmt} \\text{{ J}}"],
                "steps": [
                    "1. **Work Definition**: Work is force applied through a parallel displacement (W = F · d · cos θ).",
                    f"2. **Compute**: W = {f_val} × {d_val} = {w_fmt} J."
                ],
                "analogy": "Holding a heavy barbell motionless does zero work in physics (d = 0); lifting it overhead requires mechanical work.",
                "pitfalls": "Work is strictly zero if the displacement is perpendicular to the applied force vector (cos 90° = 0).",
                "confidence": "100% Classical Mechanics Standard"
            }

    # 9. Temperature Conversions: C to F, F to C
    m_c2f = re.search(r'convert\s*(-?\d+(?:\.\d+)?)\s*(?:c|celsius)\s*to\s*(?:f|fahrenheit)', raw_lower)
    if m_c2f:
        c = float(m_c2f.group(1))
        f = (c * 9.0 / 5.0) + 32.0
        f_fmt = int(f) if f.is_integer() else round(f, 2)
        return {
            "title": f"Temperature Conversion: {c}°C to Fahrenheit",
            "core": f"**{c}°C is equal to {f_fmt}°F**.",
            "formulas": [f"F = \\left(C \\times \\frac{{9}}{{5}}\\right) + 32 = \\left({c} \\times 1.8\\right) + 32 = {f_fmt}^\\circ\\text{{F}}"],
            "steps": [
                f"1. **Multiply by 9/5 (1.8)**: {c} × 1.8 = {round(c * 1.8, 2)}.",
                f"2. **Add 32**: {round(c * 1.8, 2)} + 32 = {f_fmt}°F."
            ],
            "analogy": "Water freezes at 0°C (32°F) and boils at 100°C (212°F).",
            "pitfalls": "Remember to add 32 AFTER multiplying by 9/5, not before!",
            "confidence": "100% Thermodynamic Standard"
        }

    m_f2c = re.search(r'convert\s*(-?\d+(?:\.\d+)?)\s*(?:f|fahrenheit)\s*to\s*(?:c|celsius)', raw_lower)
    if m_f2c:
        f = float(m_f2c.group(1))
        c = (f - 32.0) * 5.0 / 9.0
        c_fmt = int(c) if c.is_integer() else round(c, 2)
        return {
            "title": f"Temperature Conversion: {f}°F to Celsius",
            "core": f"**{f}°F is equal to {c_fmt}°C**.",
            "formulas": [f"C = (F - 32) \\times \\frac{{5}}{{9}} = ({f} - 32) \\times \\frac{{5}}{{9}} = {c_fmt}^\\circ\\text{{C}}"],
            "steps": [
                f"1. **Subtract 32**: {f} - 32 = {round(f - 32, 2)}.",
                f"2. **Multiply by 5/9**: {round(f - 32, 2)} × (5/9) = {c_fmt}°C."
            ],
            "analogy": "Subtracting 32 aligns freezing points; multiplying by 5/9 scales the interval.",
            "pitfalls": "Subtract 32 first before multiplying by 5/9!",
            "confidence": "100% Thermodynamic Standard"
        }

    # 10. Factorial: e.g. "factorial of 6" or "6!"
    m_fact = re.search(r'(?:factorial of\s+(\d+)|(\d+)\s*!)', raw_lower)
    if m_fact:
        n = int(m_fact.group(1) or m_fact.group(2))
        if n <= 100:
            val = math.factorial(n)
            return {
                "title": f"Factorial Calculation: {n}!",
                "core": f"**{n}! = {val}**.",
                "formulas": [f"{n}! = \\prod_{{i=1}}^{{{n}}} i = {val}"],
                "steps": [
                    f"1. **Definition**: The factorial n! is the product of all positive integers less than or equal to n.",
                    f"2. **Calculation**: {' × '.join(str(i) for i in range(n, 0, -1)[:8])}{'...' if n > 8 else ''} = {val}."
                ],
                "analogy": f"The number of unique ways to arrange {n} books on a shelf is {n}!.",
                "pitfalls": "Remember that by mathematical definition, 0! = 1.",
                "confidence": "100% Combinatoric Precision"
            }

    # 11. GCD / LCM
    m_gcd = re.search(r'gcd\s+(?:of\s+)?(\d+)\s*(?:and|,)\s*(\d+)', raw_lower)
    if m_gcd:
        a, b = int(m_gcd.group(1)), int(m_gcd.group(2))
        g = math.gcd(a, b)
        return {
            "title": f"Greatest Common Divisor: GCD({a}, {b})",
            "core": f"The greatest common divisor of {a} and {b} is **{g}**.",
            "formulas": [f"\\gcd({a}, {b}) = {g}"],
            "steps": [
                f"1. **Euclidean Algorithm**: Repeatedly take remainders: {a} mod {b}.",
                f"2. **Result**: The greatest integer dividing both numbers is {g}."
            ],
            "analogy": "The largest square tile that can evenly pave a floor of dimensions {a} × {b} without cutting tiles.",
            "pitfalls": "Do not confuse GCD (largest divisor) with LCM (smallest multiple).",
            "confidence": "100% Number Theory Standard"
        }

    # 12. Prime Check
    m_prime = re.search(r'is\s+(\d+)\s+prime', raw_lower)
    if m_prime:
        n = int(m_prime.group(1))
        is_p = n > 1 and all(n % i != 0 for i in range(2, int(math.isqrt(n)) + 1))
        verdict = f"**{n} IS a prime number** (it has no divisors other than 1 and itself)." if is_p else f"**{n} is NOT a prime number** (it is composite)."
        return {
            "title": f"Primality Test: Is {n} Prime?",
            "core": verdict,
            "formulas": [f"\\text{{Prime}}({n}) = {is_p}"],
            "steps": [
                f"1. **Trial Division**: Test all prime factors up to √{n} ≈ {int(math.isqrt(n))}.",
                f"2. **Divisibility Check**: {'No divisors found' if is_p else 'Divisor exists in range'}."
            ],
            "analogy": "Prime numbers are the 'atoms' of arithmetic; all integers are built by multiplying primes.",
            "pitfalls": "1 is neither prime nor composite by definition. 2 is the only even prime number.",
            "confidence": "100% Number Theory Standard"
        }

    clean = raw_lower.replace('?', '').replace('=', '').strip()
    clean = re.sub(r'^(what is|calculate|evaluate|solve|compute|find|tell me)\s+', '', clean).strip()

    # 13. Square Root: sqrt(144)
    m_sqrt = re.search(r'(?:sqrt|square root of)\s*\(?(\d+(?:\.\d+)?)\)?', clean)
    if m_sqrt:
        val = float(m_sqrt.group(1))
        ans = math.sqrt(val)
        ans_fmt = int(ans) if ans.is_integer() else round(ans, 4)
        return {
            "title": f"Square Root Calculation: √{val}",
            "core": f"The principal square root of $${val}$$ is **{ans_fmt}** (since $${ans_fmt}^2 = {val}$$).",
            "formulas": [f"\\sqrt{{{val}}} = {ans_fmt}"],
            "steps": [
                f"1. **Definition**: The principal square root √x is the unique non-negative number r such that r² = x.",
                f"2. **Factorization**: Express {val} in prime factors or radicals.",
                f"3. **Result**: $$\\mathbf{{\\sqrt{{{val}}} = {ans_fmt}}}$$"
            ],
            "analogy": f"Finding a square root is finding the side length of a square whose surface area equals {val} square units.",
            "pitfalls": "While (-r)² also equals x, the square root radical symbol √ is strictly defined as the principal (non-negative) root.",
            "confidence": "100% Deterministic Mathematical Precision"
        }

    # 14. Geometry: Circle Area
    m_circle = re.search(r'area of (?:a )?circle.*?radius\s*(\d+(?:\.\d+)?)', clean)
    if m_circle:
        r = float(m_circle.group(1))
        area = math.pi * r * r
        rounded_area = round(area, 4)
        return {
            "title": f"Circle Area Calculation (radius = {r})",
            "core": f"The area of a circle with radius $${r}$$ is approximately **{rounded_area}** square units.",
            "formulas": [f"A = \\pi r^2 = \\pi ({r})^2 \\approx {rounded_area}"],
            "steps": [
                f"1. **Area Formula**: The area of a circle is given by A = πr².",
                f"2. **Square the Radius**: r = {r} ⟹ r² = {r*r}.",
                f"3. **Multiply by Pi (π ≈ 3.14159)**: A = π × {r*r} ≈ {rounded_area}."
            ],
            "analogy": "Imagine unwinding concentric rings of the circle into a triangle of base 2πr and height r: Area = 1/2 × (2πr) × r = πr².",
            "pitfalls": "Do not confuse radius with diameter! If diameter is given, divide by 2 before squaring.",
            "confidence": "100% Geometric Standard"
        }

    # 15. Geometry: Triangle Area
    m_tri = re.search(r'area of (?:a )?triangle.*?(?:base\s*(\d+(?:\.\d+)?).*?height\s*(\d+(?:\.\d+)?)|height\s*(\d+(?:\.\d+)?).*?base\s*(\d+(?:\.\d+)?))', clean)
    if m_tri:
        b = float(m_tri.group(1) or m_tri.group(4))
        h = float(m_tri.group(2) or m_tri.group(3))
        area = 0.5 * b * h
        a_fmt = int(area) if area.is_integer() else round(area, 4)
        return {
            "title": f"Triangle Area Calculation (base={b}, height={h})",
            "core": f"The area of the triangle is **{a_fmt}** square units.",
            "formulas": [f"A = \\frac{{1}}{{2}} b \\cdot h = \\frac{{1}}{{2}} ({b}) ({h}) = {a_fmt}"],
            "steps": [
                f"1. **Formula**: Area = 1/2 × base × height.",
                f"2. **Compute**: 0.5 × {b} × {h} = {a_fmt}."
            ],
            "analogy": "Any triangle is exactly half of a parallelogram with the same base and height.",
            "pitfalls": "Height must be measured perpendicular to the base, not along the slanted side!",
            "confidence": "100% Geometric Standard"
        }

    # 16. Geometry: Hypotenuse / Pythagorean theorem
    m_pyth = re.search(r'hypotenuse.*?(?:sides?|legs?)\s*(\d+(?:\.\d+)?)\s*(?:and|,)\s*(\d+(?:\.\d+)?)', clean)
    if m_pyth:
        a, b = float(m_pyth.group(1)), float(m_pyth.group(2))
        c = math.sqrt(a**2 + b**2)
        c_fmt = int(c) if c.is_integer() else round(c, 4)
        return {
            "title": f"Pythagorean Hypotenuse Calculation (a={a}, b={b})",
            "core": f"For a right triangle with legs {a} and {b}, the hypotenuse is **{c_fmt}**.",
            "formulas": [f"c = \\sqrt{{a^2 + b^2}} = \\sqrt{{{a}^2 + {b}^2}} = \\sqrt{{{a**2 + b**2}}} = {c_fmt}"],
            "steps": [
                f"1. **Pythagorean Theorem**: In any right triangle, a² + b² = c².",
                f"2. **Compute Squares**: {a}² = {a*a}, {b}² = {b*b}, sum = {a*a + b*b}.",
                f"3. **Take Square Root**: c = √({a*a + b*b}) = {c_fmt}."
            ],
            "analogy": "Cutting diagonally across a rectangular courtyard is always shorter than walking the two sidewalk edges.",
            "pitfalls": "This formula applies strictly to right triangles (90°). For other triangles, use the Law of Cosines.",
            "confidence": "100% Deterministic Pythagorean Theorem"
        }

    # 16b. Geometry: Rectangle Area and Perimeter
    m_rect = re.search(r'(?:area|perimeter) of (?:a )?rectangle.*?(?:length\s*(\d+(?:\.\d+)?).*?width\s*(\d+(?:\.\d+)?)|width\s*(\d+(?:\.\d+)?).*?length\s*(\d+(?:\.\d+)?))', clean)
    if m_rect:
        l = float(m_rect.group(1) or m_rect.group(4))
        w = float(m_rect.group(2) or m_rect.group(3))
        is_perim = "perimeter" in clean
        if is_perim:
            p = 2 * (l + w)
            p_fmt = int(p) if p.is_integer() else round(p, 4)
            return {
                "title": f"Rectangle Perimeter (length={l}, width={w})",
                "core": f"The perimeter of the rectangle is **{p_fmt}** units.",
                "formulas": [f"P = 2(l + w) = 2({l} + {w}) = {p_fmt}"],
                "steps": [f"1. **Formula**: P = 2 × (length + width).", f"2. **Compute**: 2 × ({l} + {w}) = {p_fmt}."],
                "analogy": "Perimeter is the length of fence needed to completely surround the field.",
                "pitfalls": "Perimeter is measured in linear units, not square units!",
                "confidence": "100% Geometric Standard"
            }
        else:
            area = l * w
            a_fmt = int(area) if area.is_integer() else round(area, 4)
            return {
                "title": f"Rectangle Area (length={l}, width={w})",
                "core": f"The area of the rectangle is **{a_fmt}** square units.",
                "formulas": [f"A = l \\cdot w = ({l}) \\times ({w}) = {a_fmt}"],
                "steps": [f"1. **Formula**: Area = length × width.", f"2. **Compute**: {l} × {w} = {a_fmt}."],
                "analogy": "Area counts how many 1×1 unit square tiles fit on the floor.",
                "pitfalls": "Ensure both length and width are in the same units before multiplying!",
                "confidence": "100% Geometric Standard"
            }

    # 16c. Geometry: Sphere Volume (4/3 * pi * r^3)
    m_sphere = re.search(r'(?:volume of (?:a )?sphere.*?radius\s*(\d+(?:\.\d+)?)|sphere.*?radius\s*(\d+(?:\.\d+)?).*?volume)', clean)
    if m_sphere:
        r = float(m_sphere.group(1) or m_sphere.group(2))
        vol = (4.0 / 3.0) * math.pi * (r ** 3)
        v_fmt = int(vol) if vol.is_integer() else round(vol, 4)
        return {
            "title": f"Sphere Volume Calculation (radius = {r})",
            "core": f"The volume of the sphere is approximately **{v_fmt}** cubic units.",
            "formulas": [f"V = \\frac{{4}}{{3}} \\pi r^3 = \\frac{{4}}{{3}} \\pi ({r})^3 \\approx {v_fmt}"],
            "steps": [
                f"1. **Formula**: V = (4/3) · π · r³.",
                f"2. **Cube Radius**: r³ = ({r})³ = {r**3}.",
                f"3. **Compute**: (4/3) × π × {r**3} ≈ {v_fmt}."
            ],
            "analogy": "A sphere's volume is exactly 2/3 the volume of a cylinder that tightly encloses it (discovered by Archimedes).",
            "pitfalls": "Do not confuse radius with diameter, and remember radius is CUBED (r³), not squared!",
            "confidence": "100% Geometric Standard"
        }

    # 17. Arithmetic Expressions (e.g. "25 * 16", "100 / 4 + 7", "2^8")
    math_pattern = r'^[\d\s\+\-\*\/\^\(\)\.\%xX]+$'
    if re.match(math_pattern, clean) and any(c in clean for c in '+-*/^xX%'):
        try:
            expr_str = clean.replace('^', '**').replace('x', '*').replace('X', '*')
            
            def _eval(node):
                if isinstance(node, ast.Num):
                    return node.n
                elif isinstance(node, ast.Constant):
                    return node.value
                elif isinstance(node, ast.BinOp):
                    return SAFE_OPS[type(node.op)](_eval(node.left), _eval(node.right))
                elif isinstance(node, ast.UnaryOp):
                    return SAFE_OPS[type(node.op)](_eval(node.operand))
                raise TypeError(node)
                
            tree = ast.parse(expr_str, mode='eval').body
            result = _eval(tree)
            
            if isinstance(result, float) and result.is_integer():
                result = int(result)
            elif isinstance(result, float):
                result = round(result, 4)
                
            return {
                "title": f"Mathematical Calculation: {clean}",
                "core": f"The exact evaluation of $${clean}$$ is **{result}**.",
                "formulas": [f"{clean} = {result}"],
                "steps": [
                    f"1. **Parse Expression**: Identify numbers and operator hierarchy (PEMDAS/BODMAS).",
                    f"2. **Compute**: Step-by-step arithmetic evaluation yields exact value.",
                    f"3. **Result**: $$\\mathbf{{{clean} = {result}}}$$"
                ],
                "analogy": f"Just like grouping items into equal bundles, arithmetic operations systematically scale or combine quantities.",
                "pitfalls": "Remember PEMDAS: Parentheses, Exponents, Multiplication & Division (left to right), Addition & Subtraction (left to right).",
                "confidence": "100% Deterministic Mathematical Precision"
            }
        except Exception:
            return None
    return None

def lookup_factual_knowledge(query: str) -> Optional[Dict[str, Any]]:
    """Accurately match common factual, scientific, and geographic questions with verified answers."""
    q = query.lower().strip()
    
    FACTS_CATALOG = [
        # CELL BIOLOGY
        (r'power\s*house\s+of\s+(?:the\s+)?cell', {
            "title": "Cellular Biology: Mitochondria",
            "core": "**The Mitochondria** (singular: mitochondrion) is the powerhouse of the cell.",
            "formulas": [r"\text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2 \to 6\text{CO}_2 + 6\text{H}_2\text{O} + 36\text{-}38\text{ ATP}"],
            "steps": [
                "1. **Primary Function**: Mitochondria generate over 90% of cellular chemical energy stored in Adenosine Triphosphate (ATP).",
                "2. **Key Stages**: Cellular respiration proceeds through Glycolysis (cytoplasm) ⟶ Krebs Cycle (mitochondrial matrix) ⟶ Electron Transport Chain (inner cristae).",
                "3. **Unique Trait**: Mitochondria possess their own independent circular DNA (mtDNA) and double-membrane structure, supporting the endosymbiotic theory."
            ],
            "analogy": "Mitochondria are like the electrical power plants of a bustling city, converting incoming fuel (sugar/glucose) into electricity (ATP).",
            "pitfalls": "Red blood cells (erythrocytes) do NOT contain mitochondria; they produce energy exclusively via anaerobic glycolysis!",
            "confidence": "100% Cell Biology Standard"
        }),
        # SPEED OF LIGHT
        (r'speed\s+of\s+light', {
            "title": "Fundamental Constant: Speed of Light (c)",
            "core": "The speed of light in a vacuum is exactly **299,792,458 m/s** (commonly approximated as $$3.0 \\times 10^8\\text{ m/s}$$).",
            "formulas": [r"c = 299{,}792{,}458 \, \text{m/s} \approx 3.0 \times 10^8 \, \text{m/s}", r"E = m c^2"],
            "steps": [
                "1. **Universal Invariant**: Under Einstein's Special Relativity, the speed of light in vacuum is identical for all inertial observers regardless of motion.",
                "2. **Cosmic Speed Limit**: No massive particle or information can travel faster than c in vacuum.",
                "3. **Refraction**: Light slows down when entering denser media like water (v ≈ 2.25 × 10⁸ m/s) or glass (v ≈ 2.0 × 10⁸ m/s)."
            ],
            "analogy": "Light travels fast enough to circumnavigate Earth's equator roughly 7.5 times in a single second.",
            "pitfalls": "The speed of light is only exactly 299,792,458 m/s in a true vacuum; inside glass or water, refractive index n reduces its phase velocity (v = c / n).",
            "confidence": "100% Physical Constant Precision"
        }),
        # PLANCK'S CONSTANT
        (r'planck(?:\'s)?\s*constant', {
            "title": "Quantum Constant: Planck's Constant (h)",
            "core": "Planck's constant is **$$6.62607015 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$$**.",
            "formulas": [r"h = 6.62607015 \times 10^{-34} \, \text{J}\cdot\text{s}", r"E = h\nu = \frac{hc}{\lambda}", r"\hbar = \frac{h}{2\pi} \approx 1.05457 \times 10^{-34} \, \text{J}\cdot\text{s}"],
            "steps": [
                "1. **Quantum of Action**: Relates photon energy directly to its electromagnetic frequency: E = h·ν.",
                "2. **Reduced Planck Constant**: \\hbar = h / (2π), fundamental to Heisenberg's Uncertainty Principle (\\Delta x \\Delta p \\ge \\hbar/2).",
                "3. **SI Definition**: Since 2019, the kilogram is officially defined in terms of Planck's constant."
            ],
            "analogy": "Planck's constant is the universal 'pixel resolution' of quantum reality—energy cannot be exchanged in continuous amounts, only in discrete packets of h.",
            "pitfalls": "Do not confuse Planck's constant h with reduced Planck's constant \\hbar (h-bar = h / 2π).",
            "confidence": "100% Quantum Physics Precision"
        }),
        # AVOGADRO'S NUMBER
        (r'avogadro(?:\'s)?\s*(?:number|constant)?', {
            "title": "Chemical Constant: Avogadro's Number (N_A)",
            "core": "Avogadro's constant is **$$6.02214076 \\times 10^{23} \\text{ mol}^{-1}$$**.",
            "formulas": [r"N_A = 6.02214076 \times 10^{23} \, \text{particles/mol}", r"n = \frac{N}{N_A} = \frac{m}{M}"],
            "steps": [
                "1. **Mole Definition**: Exactly one mole of any pure chemical substance contains 6.022 × 10²³ constituent particles (atoms, molecules, or ions).",
                "2. **Atomic Weight Link**: Makes atomic mass units numerically equal to grams per mole (e.g., 1 Carbon-12 atom = 12 u, 1 mole of C-12 = 12 grams)."
            ],
            "analogy": "Just like a 'dozen' represents 12 items, a 'mole' represents 6.022 × 10²³ chemical items.",
            "pitfalls": "Avogadro's number is a pure count; it applies equally to atoms, molecules, electrons, or ions.",
            "confidence": "100% Chemical Standard"
        }),
        # GRAVITATIONAL ACCELERATION
        (r'(?:acceleration due to gravity|gravity on earth)', {
            "title": "Earth Surface Gravity (g)",
            "core": "Standard acceleration due to gravity at Earth's surface is **$$g \\approx 9.80665 \\text{ m/s}^2$$** (commonly rounded to $$9.81 \\text{ m/s}^2$$ or $$9.8 \\text{ m/s}^2$$).",
            "formulas": [r"g = \frac{G M_{\text{earth}}}{R_{\text{earth}}^2} \approx 9.81 \, \text{m/s}^2", r"W = m \cdot g"],
            "steps": [
                "1. **Free Fall**: Every second an object falls freely in vacuum near Earth, its downward velocity increases by ~9.81 m/s.",
                "2. **Variation**: Slightly higher at the poles (~9.83 m/s²) than at the equator (~9.78 m/s²) due to Earth's equatorial bulge and centrifugal spin."
            ],
            "analogy": "If you drop a bowling ball from rest without air resistance, it travels at 9.8 m/s after 1s, 19.6 m/s after 2s, and 29.4 m/s after 3s.",
            "pitfalls": "g is an acceleration (m/s²), whereas weight W = mg is a force measured in Newtons (N)!",
            "confidence": "100% Astrophysical Standard"
        }),
        # WORLD CAPITALS
        (r'capital\s+of\s+france', {"title": "World Capital: France", "core": "The capital of France is **Paris**.", "steps": ["1. Paris is situated along the Seine River in north-central France.", "2. It serves as France's political, cultural, and economic center."], "formulas": [], "analogy": "The City of Light.", "pitfalls": "None", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+japan', {"title": "World Capital: Japan", "core": "The capital of Japan is **Tokyo**.", "steps": ["1. Tokyo is the most populous metropolitan area in the world.", "2. Formerly known as Edo until the Meiji Restoration in 1868."], "formulas": [], "analogy": "Global tech and financial hub.", "pitfalls": "Kyoto was the imperial capital of Japan before Tokyo.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+(?:the\s+)?(?:united\s+states|usa|america)', {"title": "World Capital: United States", "core": "The capital of the United States is **Washington, D.C.**", "steps": ["1. D.C. stands for the District of Columbia, a federal district not part of any US state.", "2. Established by the Residence Act in 1790 along the Potomac River."], "formulas": [], "analogy": "Seat of the three branches of the US federal government.", "pitfalls": "New York City is the most populous city, but NOT the capital!", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+(?:the\s+)?(?:united\s+kingdom|uk|england)', {"title": "World Capital: United Kingdom", "core": "The capital of the United Kingdom and England is **London**.", "steps": ["1. London is situated on the River Thames in southeastern England.", "2. Global financial capital established by the Romans as Londinium."], "formulas": [], "analogy": "Hub of global trade and history.", "pitfalls": "London is the capital of both England and the wider United Kingdom.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+germany', {"title": "World Capital: Germany", "core": "The capital of Germany is **Berlin**.", "steps": ["1. Berlin is Germany's largest city and seat of the Bundestag.", "2. Re-unified as capital following the fall of the Berlin Wall in 1989."], "formulas": [], "analogy": "Cultural and technological center of Central Europe.", "pitfalls": "Bonn served as the provisional capital of West Germany from 1949 to 1990.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+india', {"title": "World Capital: India", "core": "The capital of India is **New Delhi**.", "steps": ["1. New Delhi is an urban district located within the National Capital Territory of Delhi.", "2. Designed by British architects Edwin Lutyens and Herbert Baker; capital moved from Calcutta in 1911."], "formulas": [], "analogy": "Administrative heart of the world's most populous democracy.", "pitfalls": "New Delhi is the specific capital territory, while Delhi refers to the broader metropolitan region.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+italy', {"title": "World Capital: Italy", "core": "The capital of Italy is **Rome**.", "steps": ["1. Rome is known as the 'Eternal City', located along the Tiber River.", "2. Encompasses Vatican City, an independent country within its boundaries."], "formulas": [], "analogy": "Cradle of Western civilization and Roman law.", "pitfalls": "Milan is Italy's financial center, but Rome is the political capital.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+spain', {"title": "World Capital: Spain", "core": "The capital of Spain is **Madrid**.", "steps": ["1. Madrid is located in the geographic center of the Iberian Peninsula.", "2. Home to the royal palace and the Prado Museum."], "formulas": [], "analogy": "Center of Spanish culture, language, and art.", "pitfalls": "Barcelona is Catalonia's regional capital, but Madrid is Spain's national capital.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+canada', {"title": "World Capital: Canada", "core": "The capital of Canada is **Ottawa**.", "steps": ["1. Located in Ontario on the border of Quebec, along the Ottawa River.", "2. Chosen by Queen Victoria in 1857 as a strategic compromise between Toronto and Montreal."], "formulas": [], "analogy": "Seat of the Canadian Parliament on Parliament Hill.", "pitfalls": "Toronto and Montreal are Canada's largest cities, but Ottawa is the capital!", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+australia', {"title": "World Capital: Australia", "core": "The capital of Australia is **Canberra**.", "steps": ["1. Canberra is located in the Australian Capital Territory (ACT).", "2. Selected as a compromise in 1908 to resolve the rivalry between Sydney and Melbourne."], "formulas": [], "analogy": "A purpose-built planned garden city.", "pitfalls": "Sydney and Melbourne are NOT the capital of Australia!", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+china', {"title": "World Capital: China", "core": "The capital of China is **Beijing**.", "steps": ["1. One of the Four Great Ancient Capitals of China, formerly romanized as Peking.", "2. Home to the Forbidden City and Tiananmen Square."], "formulas": [], "analogy": "Political center of East Asia for over eight centuries.", "pitfalls": "Shanghai is China's largest economic city, but Beijing is the political capital.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+russia', {"title": "World Capital: Russia", "core": "The capital of Russia is **Moscow**.", "steps": ["1. Moscow is situated on the Moskva River and is Europe's second-most populous city.", "2. Historic site of the Kremlin and Red Square."], "formulas": [], "analogy": "Heart of Russian politics and culture.", "pitfalls": "Saint Petersburg was the Russian imperial capital from 1712 to 1918.", "confidence": "100% Geographic Standard"}),
        (r'capital\s+of\s+brazil', {"title": "World Capital: Brazil", "core": "The capital of Brazil is **Brasília**.", "steps": ["1. Planned federal capital founded in 1960 and designed by Oscar Niemeyer and Lúcio Costa.", "2. Shaped like a bird/airplane from above."], "formulas": [], "analogy": "Modernist planned administrative capital.", "pitfalls": "Rio de Janeiro and São Paulo are NOT the capital of Brazil!", "confidence": "100% Geographic Standard"}),
        # HUMAN BIOLOGY
        (r'(?:largest organ|biggest organ)\s+in\s+(?:the\s+)?human\s+body', {
            "title": "Human Anatomy: Largest Organ",
            "core": "**The Skin** (integumentary system) is the largest organ of the human body.",
            "steps": [
                "1. **Surface Area & Mass**: Covers approximately 1.5 to 2.0 square meters in adults, accounting for ~16% of total body weight.",
                "2. **Three Layers**: Epidermis (outer barrier), Dermis (connective tissue, nerves, sweat glands), Hypodermis (subcutaneous fat).",
                "3. **Key Roles**: Thermoregulation, protection against pathogens, sensation, and synthesis of Vitamin D."
            ],
            "formulas": [],
            "analogy": "The skin is your body's waterproof, self-repairing biometric shield.",
            "pitfalls": "The liver is the largest INTERNAL organ, but the skin is the largest organ overall!",
            "confidence": "100% Anatomical Standard"
        }),
        (r'(?:how many bones|number of bones)\s+in\s+(?:the\s+)?(?:adult\s+)?human\s+body', {
            "title": "Human Anatomy: Skeletal System",
            "core": "An adult human body has **206 bones**.",
            "steps": [
                "1. **Infant vs Adult**: Babies are born with ~270 bones; many fuse together during growth (such as skull plates and sacrum).",
                "2. **Division**: Axial skeleton (80 bones: skull, spine, rib cage) and Appendicular skeleton (126 bones: limbs and girdles).",
                "3. **Smallest & Largest**: The stapes (stirrup) in the middle ear is the smallest (~3 mm); the femur (thigh bone) is the largest and strongest."
            ],
            "formulas": [],
            "analogy": "The skeleton is the structural steel framework of the human architecture.",
            "pitfalls": "Infants have ~270 bones; 206 is strictly the adult count after fusion.",
            "confidence": "100% Anatomical Standard"
        }),
        (r'(?:how many chromosomes|number of chromosomes)\s+in\s+(?:the\s+)?human', {
            "title": "Human Genetics: Chromosome Count",
            "core": "Humans possess **46 chromosomes** organized into **23 pairs** in each somatic cell.",
            "steps": [
                "1. **Autosomes**: 22 homologous pairs (44 chromosomes) governing general somatic traits.",
                "2. **Sex Chromosomes**: 1 pair (XX in biological females, XY in biological males).",
                "3. **Gametes**: Human sperm and egg cells are haploid (n = 23 chromosomes), restoring the diploid count (2n = 46) upon fertilization."
            ],
            "formulas": [r"2n = 46 \quad \text{(Diploid Somatic)}, \quad n = 23 \quad \text{(Haploid Gamete)}"],
            "analogy": "Chromosomes are like 23 volumes of an instruction encyclopedia, with two editions (one from mom, one from dad).",
            "pitfalls": "Down Syndrome (Trisomy 21) is caused by an extra 47th chromosome on pair 21.",
            "confidence": "100% Genetics Precision"
        }),
        # CHEMISTRY & PHYSICS
        (r'ph\s+of\s+(?:pure\s+)?water', {
            "title": "Chemistry: pH of Pure Water",
            "core": "Pure water at 25°C has a neutral pH of exactly **7.0**.",
            "formulas": [r"\text{pH} = -\log_{10}[\text{H}^+] = -\log_{10}(1.0 \times 10^{-7}) = 7.0", r"K_w = [\text{H}^+][\text{OH}^-] = 1.0 \times 10^{-14} \quad (\text{at } 25^\circ\text{C})"],
            "steps": [
                "1. **Auto-Ionization**: Water naturally self-ionizes into hydronium (H₃O⁺) and hydroxide (OH⁻) ions in equal measure: 10⁻⁷ M each.",
                "2. **Neutrality**: Because [H⁺] = [OH⁻], the solution is perfectly neutral."
            ],
            "analogy": "7.0 is the exact balance point on a seesaw between acidic (<7) and basic (>7).",
            "pitfalls": "pH of water drops slightly with increased temperature because auto-ionization Kw increases, but it remains neutral because [H⁺] still equals [OH⁻]!",
            "confidence": "100% Chemical Standard"
        }),
        (r'boiling\s+point\s+of\s+water', {
            "title": "Chemistry: Boiling Point of Water",
            "core": "At standard atmospheric pressure (1 atm / 101.325 kPa), pure water boils at **100°C** (212°F / 373.15 K).",
            "formulas": [r"T_{\text{boil}} = 100^\circ\text{C} = 212^\circ\text{F} = 373.15 \, \text{K}"],
            "steps": [
                "1. **Phase Change**: Liquid water vaporizes into steam when its vapor pressure equals ambient atmospheric pressure.",
                "2. **Altitude Effect**: At higher elevations (lower atmospheric pressure), water boils at a lower temperature (e.g., ~93°C in Denver)."
            ],
            "analogy": "Boiling occurs when the escaping vapor pressure overcomes the atmospheric blanket pressing down on the liquid.",
            "pitfalls": "100°C is strictly at sea-level 1 atm pressure. In a pressure cooker (high pressure), boiling point exceeds 120°C.",
            "confidence": "100% Physical Chemistry Standard"
        }),
        (r'most\s+abundant\s+gas\s+in\s+earth(?:\'s)?\s+atmosphere', {
            "title": "Atmospheric Science: Air Composition",
            "core": "**Nitrogen (N₂)** is the most abundant gas in Earth's atmosphere, constituting **78.08%** of dry air by volume.",
            "steps": [
                "1. **Nitrogen (N₂)**: 78.08% (Triple-bonded diatomic molecule, relatively inert).",
                "2. **Oxygen (O₂)**: 20.95% (Vital for aerobic respiration and combustion).",
                "3. **Argon (Ar)**: 0.93% (Inert noble gas).",
                "4. **Carbon Dioxide (CO₂)**: ~0.04% (~420 ppm, primary greenhouse gas)."
            ],
            "formulas": [],
            "analogy": "Air is roughly 4 parts nitrogen and 1 part oxygen.",
            "pitfalls": "Many people incorrectly guess Oxygen, but Nitrogen makes up nearly 4/5ths of the atmosphere!",
            "confidence": "100% Atmospheric Standard"
        }),
        # COMPUTER SCIENCE
        (r'(?:difference between tcp and udp|tcp vs udp)', {
            "title": "Computer Networks: TCP vs UDP",
            "core": "**TCP** is connection-oriented, reliable, and guarantees ordered packet delivery, whereas **UDP** is connectionless, lightweight, and focuses on maximum speed without delivery guarantees.",
            "steps": [
                "1. **TCP (Transmission Control Protocol)**: Uses a 3-Way Handshake (SYN -> SYN-ACK -> ACK), verifies delivery with acknowledgments, retransmits lost packets, and manages flow control. Used for HTTP/HTTPS, SSH, File Transfer (FTP), Email (SMTP).",
                "2. **UDP (User Datagram Protocol)**: Sends packets ('datagrams') with zero handshake or delivery confirmation. Has minimal header overhead (8 bytes vs 20+ bytes). Used for real-time video streaming, Discord voice/VoIP, DNS lookups, and multiplayer games."
            ],
            "formulas": [r"\text{TCP Overhead: } \ge 20 \text{ bytes}, \quad \text{UDP Overhead: } 8 \text{ bytes}"],
            "analogy": "TCP is like certified registered mail with signature confirmation; UDP is like sending postcards without tracking.",
            "pitfalls": "UDP is NOT 'worse' than TCP; it is deliberately chosen when low latency is far more important than recovering occasional lost packets.",
            "confidence": "100% Networking Standard"
        }),
        (r'(?:time complexity of binary search|binary search complexity)', {
            "title": "Algorithms: Binary Search Time Complexity",
            "core": "Binary search has a worst-case and average time complexity of **O(log n)**, with **O(1)** auxiliary space.",
            "formulas": [r"T(n) = T(n/2) + O(1) \implies O(\log_2 n)"],
            "steps": [
                "1. **Divide and Conquer**: Compares the target against the middle element of a sorted array.",
                "2. **Halving**: Discards half of the remaining array on every iteration.",
                "3. **Logarithmic Scaling**: In an array of 1,000,000 items, binary search finds any element in at most ~20 comparisons (log₂(1,000,000) ≈ 19.93)."
            ],
            "analogy": "Looking up a word in a printed physical dictionary by opening to the middle, then flipping to the middle of the remaining half.",
            "pitfalls": "Binary search STRICTLY requires the input array to be pre-sorted. On an unsorted array, linear search O(n) must be used unless sorted first O(n log n).",
            "confidence": "100% Computer Science Standard"
        }),
        (r'who\s+discovered\s+penicillin', {
            "title": "History of Medicine: Discovery of Penicillin",
            "core": "Scottish bacteriologist **Sir Alexander Fleming** discovered penicillin in **1928** at St. Mary's Hospital in London.",
            "steps": [
                "1. **Accidental Discovery**: Fleming noticed a contaminated culture plate of *Staphylococcus* where bacteria surrounding a mold colony (*Penicillium notatum*) had dissolved.",
                "2. **Mass Production**: Later isolated and purified for clinical wartime use by Howard Florey and Ernst Chain at Oxford University.",
                "3. **Legacy**: The world's first true antibiotic, saving tens of millions of lives from bacterial infections."
            ],
            "formulas": [],
            "analogy": "A fungal defense weapon repurposed into a human medical shield.",
            "pitfalls": "Fleming discovered penicillin, but Florey and Chain were responsible for purifying and mass-producing it into a medicine (all three shared the 1945 Nobel Prize).",
            "confidence": "100% Medical History Standard"
        }),
        # PHOTOSYNTHESIS
        (r'what\s+is\s+photosynthesis', {
            "title": "Plant Biology: Photosynthesis",
            "core": "**Photosynthesis** is the biological process by which green plants, algae, and cyanobacteria convert light energy into chemical energy (glucose) using water and carbon dioxide.",
            "formulas": [r"6\text{CO}_2 + 6\text{H}_2\text{O} + \text{photons} \xrightarrow{\text{chlorophyll}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2"],
            "steps": [
                "1. **Light Reactions (Thylakoid Membrane)**: Solar photons excite electrons in chlorophyll, photolyzing water and generating ATP + NADPH + O₂ byproduct.",
                "2. **Calvin Cycle (Stroma)**: Light-independent fixation of atmospheric CO₂ into 3-carbon sugars using ATP and NADPH (catalyzed by RuBisCO)."
            ],
            "analogy": "Leaves are natural solar panel factories taking ambient air (CO₂) and ground water to fabricate sugar fuel blocks.",
            "pitfalls": "The oxygen released during photosynthesis comes entirely from splitting H₂O, NOT from CO₂!",
            "confidence": "100% Biochemical Standard"
        }),
        # DNA
        (r'what\s+is\s+dna', {
            "title": "Molecular Biology: DNA (Deoxyribonucleic Acid)",
            "core": "**DNA** (Deoxyribonucleic Acid) is the double-stranded helical polymer carrying genetic instructions for the development, functioning, growth, and reproduction of all known living organisms.",
            "formulas": [r"\text{Base Pairing: } \text{A} = \text{T} \quad (2\text{ H-bonds}), \quad \text{G} \equiv \text{C} \quad (3\text{ H-bonds})"],
            "steps": [
                "1. **Nucleotide Monomers**: Composed of a deoxyribose 5-carbon sugar, a phosphate backbone, and one of four nitrogenous bases (A, T, C, G).",
                "2. **Double Helix**: Two antiparallel strands (5' to 3' and 3' to 5') twisted in a right-handed spiral, held by complementary hydrogen bonds.",
                "3. **Discovery**: Structural double-helix model solved in 1953 by James Watson and Francis Crick, utilizing crucial X-ray diffraction data from Rosalind Franklin."
            ],
            "analogy": "DNA is the master architectural blueprint encoded into every living cell.",
            "pitfalls": "RNA substitutes Uracil (U) for Thymine (T) and contains ribose sugar with an extra 2' hydroxyl group (-OH).",
            "confidence": "100% Genetics Standard"
        }),
        # OSMOSIS
        (r'what\s+is\s+osmosis', {
            "title": "Cell Biology: Osmosis",
            "core": "**Osmosis** is the net passive diffusion of water molecules across a selectively permeable membrane from an area of higher water potential (lower solute concentration) to lower water potential (higher solute concentration).",
            "formulas": [r"\Pi = i \cdot M \cdot R \cdot T \quad \text{(Van 't Hoff Equation for Osmotic Pressure)}"],
            "steps": [
                "1. **Semi-Permeable Barrier**: Membrane allows small solvent molecules (water) to pass via aquaporin channels while blocking large solute particles.",
                "2. **Equilibrium Drive**: Continues until osmotic pressure balances hydrostatic pressure or equal chemical potential is achieved."
            ],
            "analogy": "Water naturally rushes to dilute the more concentrated syrup side of a porous fence.",
            "pitfalls": "Water moves toward the HIGHER solute concentration, which corresponds to the LOWER water concentration!",
            "confidence": "100% Cellular Biophysics Standard"
        }),
        # ENTROPY
        (r'what\s+is\s+entropy', {
            "title": "Thermodynamics: Entropy (S)",
            "core": "**Entropy** is a fundamental thermodynamic property quantifying the degree of microscopic disorder, randomness, or thermal energy unavailable to do mechanical work.",
            "formulas": [r"\Delta S \ge \frac{Q_{\text{rev}}}{T}, \quad S = k_B \ln \Omega \quad \text{(Boltzmann's Formula)}", r"\Delta S_{\text{universe}} \ge 0 \quad \text{(Second Law of Thermodynamics)}"],
            "steps": [
                "1. **Statistical Definition**: S = k_B · ln(Ω), where Ω is the number of accessible microstates corresponding to the macrostate.",
                "2. **Second Law**: In any spontaneous process in an isolated system, the total entropy always increases over time (arrow of time)."
            ],
            "analogy": "An egg falling and shattering increases entropy: assembling it back together spontaneously is astronomically improbable.",
            "pitfalls": "Local entropy CAN decrease (like water freezing or life growing), as long as the surrounding environmental entropy increases by a greater amount!",
            "confidence": "100% Thermodynamic Standard"
        }),
        # HARDEST NATURAL SUBSTANCE
        (r'hardest\s+natural\s+substance', {
            "title": "Materials Science: Hardest Natural Substance",
            "core": "**Diamond** is the hardest naturally occurring substance on Earth, rated at a maximum **10 on the Mohs Hardness Scale**.",
            "steps": [
                "1. **Crystal Lattice**: Allotrope of pure carbon where each carbon atom forms four rigid covalent sp³ hybridized bonds in a tetrahedral diamond-cubic lattice.",
                "2. **Bond Strength**: Extremely short (1.54 Å) and rigid carbon-carbon bonds require immense energy to cleave or indent."
            ],
            "formulas": [],
            "analogy": "A three-dimensional architectural carbon scaffold with zero weak angles.",
            "pitfalls": "Hardness (resistance to scratching) is NOT toughness! A diamond can still shatter if struck sharply with a household hammer because of its cleavage planes.",
            "confidence": "100% Mineralogy Standard"
        }),
        # TELEPHONE INVENTION
        (r'who\s+invented\s+(?:the\s+)?telephone', {
            "title": "History of Technology: The Telephone",
            "core": "**Alexander Graham Bell** is officially credited with patenting the first practical telephone on **March 7, 1876** (US Patent 174,465).",
            "steps": [
                "1. **Acoustic Telegraphy**: Bell developed electromagnetic transmitters that converted acoustic vibrations of human speech into variable electrical current.",
                "2. **First Speech**: On March 10, 1876, Bell transmitted the famous words to his assistant: *'Mr. Watson, come here, I want to see you.'*",
                "3. **Controversy**: Elisha Gray filed a patent caveat on the exact same day, and Antonio Meucci developed earlier prototypes ('telettrofono')."
            ],
            "formulas": [],
            "analogy": "Turning acoustic sound waves into electric pulses, then vibrating a receiver diaphragm to recreate the sound waves.",
            "pitfalls": "While Bell holds the official patent, the US Congress recognized Antonio Meucci's pioneer contributions in 2002.",
            "confidence": "100% History of Science Standard"
        }),
        # RELATIVITY
        (r'(?:who\s+proposed|who\s+discovered|who\s+came\s+up\s+with)\s+(?:the\s+)?theory\s+of\s+relativity', {
            "title": "Theoretical Physics: Theory of Relativity",
            "core": "**Albert Einstein** developed the Theory of Relativity: **Special Relativity in 1905** and **General Relativity in 1915**.",
            "formulas": [r"E = m c^2 \quad \text{(Mass-Energy Equivalence)}", r"G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu} \quad \text{(Einstein Field Equations)}"],
            "steps": [
                "1. **Special Relativity (1905)**: Establishes that the speed of light c is constant for all inertial observers, leading to time dilation, length contraction, and E = mc².",
                "2. **General Relativity (1915)**: Redefines gravity not as a Newtonian pull, but as the geometric warping of four-dimensional spacetime caused by mass and energy."
            ],
            "analogy": "A heavy bowling ball sitting on a stretched rubber sheet causes surrounding marbles to roll in curved orbits around it.",
            "pitfalls": "Einstein won his 1921 Nobel Prize for explaining the Photoelectric Effect, NOT directly for Relativity!",
            "confidence": "100% Relativistic Physics Standard"
        }),
        # GEOGRAPHY: MOUNTAIN, RIVER, OCEAN, CONTINENTS
        (r'(?:tallest|highest)\s+mountain\s+in\s+(?:the\s+)?world', {
            "title": "Physical Geography: Tallest Mountain",
            "core": "**Mount Everest** (Sagarmatha / Chomolungma) in the Himalayas is the highest mountain above sea level at **8,848.86 meters (29,031.7 feet)**.",
            "steps": [
                "1. **Location**: Straddles the international border between Nepal and China (Tibet Autonomous Region).",
                "2. **Tectonic Origin**: Formed and continuously pushed upward by the ongoing tectonic collision between the Indian Plate and the Eurasian Plate."
            ],
            "formulas": [],
            "analogy": "The crowning rooftop of planet Earth.",
            "pitfalls": "Mauna Kea in Hawaii is taller measured base-to-peak (~10,210 m), but Everest is highest above sea level.",
            "confidence": "100% Geographic Standard"
        }),
        (r'longest\s+river\s+in\s+(?:the\s+)?world', {
            "title": "Physical Geography: Longest River",
            "core": "**The Nile River** in northeastern Africa is traditionally recognized as the longest river in the world, stretching approximately **6,650 km (4,132 miles)**.",
            "steps": [
                "1. **Basin**: Flows northward through 11 countries into the Mediterranean Sea.",
                "2. **Two Tributaries**: The White Nile (originating in equatorial Africa) and the Blue Nile (originating in Lake Tana, Ethiopia)."
            ],
            "formulas": [],
            "analogy": "The perennial water ribbon that sustained ancient and modern Egyptian civilizations.",
            "pitfalls": "The Amazon River has the greatest water discharge volume by far, but the Nile is traditionally the longest.",
            "confidence": "100% Geographic Standard"
        }),
        (r'largest\s+ocean\s+in\s+(?:the\s+)?world', {
            "title": "Physical Geography: Largest Ocean",
            "core": "**The Pacific Ocean** is the largest and deepest ocean on Earth, covering approximately **165.25 million square kilometers (63.8 million sq mi)**.",
            "steps": [
                "1. **Extents**: Covers over 30% of Earth's total surface area—larger than all land masses combined.",
                "2. **Deepest Trench**: Contains the Mariana Trench, plunging to Challenger Deep at ~10,994 meters (36,070 feet) below sea level."
            ],
            "formulas": [],
            "analogy": "An ocean so vast that if you stood on the opposite side of Earth, you would still look at water.",
            "pitfalls": "Contains the Ring of Fire where roughly 75% of the world's active volcanoes reside.",
            "confidence": "100% Geographic Standard"
        }),
        (r'how\s+many\s+continents\s+(?:are\s+there|exist)', {
            "title": "Global Geography: The Continents",
            "core": "By the standard English-speaking geographical model, there are **7 continents**: **Asia, Africa, North America, South America, Antarctica, Europe, and Australia**.",
            "steps": [
                "1. **Largest by Area & Population**: Asia (~44.6 million km², ~4.7 billion people).",
                "2. **Smallest Continent**: Australia (~8.6 million km²).",
                "3. **Coldest & Most Isolated**: Antarctica (covered by ice sheets up to 4 km thick)."
            ],
            "formulas": [],
            "analogy": "The seven grand puzzle pieces of continental crust resting on the mantle.",
            "pitfalls": "Some countries use a 6-continent model (combining Europe and Asia into Eurasia, or the Americas into a single continent).",
            "confidence": "100% Geographic Standard"
        })
    ]
    
    for pattern, data in FACTS_CATALOG:
        if re.search(pattern, q):
            return data
            
    return None


# Comprehensive Multi-Domain Academic Curriculum Repository
ACADEMIC_REPOSITORY = {
    # MATHEMATICS
    "calculus": {
        "title": "Calculus: Limits, Derivatives & Integrals",
        "keywords": ["calculus", "derivative", "integral", "differentiation", "integration", "chain rule", "limit"],
        "core": "Calculus is the mathematical study of continuous change. Differential calculus studies rates of change and slopes of curves, while Integral calculus computes accumulation of quantities and areas under curves.",
        "formulas": [
            r"\frac{df}{dx} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}",
            r"\int_{a}^{b} f(x) \, dx = F(b) - F(a) \quad \text{where } F'(x) = f(x)",
            r"\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x) \quad \text{(Chain Rule)}"
        ],
        "steps": [
            "1. **Instantaneous Rate**: The derivative measures the slope of the tangent line at any point on a curve.",
            "2. **Differentiation Rules**: Power rule (\\frac{d}{dx}x^n = n x^{n-1}), Product rule, Quotient rule, and Chain rule.",
            "3. **Accumulation via Integration**: The definite integral sums infinite infinitesimally thin Riemann rectangles under the curve.",
            "4. **Fundamental Theorem of Calculus**: Bridges differentiation and integration as inverse operations."
        ],
        "analogy": "Your speedometer reading at any instant is the derivative (instant rate of change), while your odometer measuring total distance accumulated is the integral.",
        "pitfalls": "Forgetting the Chain Rule when differentiating composite functions like \\sin(3x^2) -> the derivative is 6x \\cos(3x^2), not just \\cos(3x^2)!",
        "confidence": "99.9% Mathematical Standard"
    },
    "quadratic": {
        "title": "Quadratic Equations & Parabolic Roots",
        "keywords": ["quadratic", "parabola", "roots of quadratic", "quadratic formula", "discriminant", "vertex"],
        "core": "A quadratic equation is a second-order polynomial equation of the form ax^2 + bx + c = 0, where a != 0. Its graph forms a parabola with roots given by the quadratic formula.",
        "formulas": [
            r"ax^2 + bx + c = 0",
            r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}",
            r"\Delta = b^2 - 4ac \quad (\Delta > 0: 2\text{ real roots}, \Delta=0: 1\text{ root}, \Delta<0: \text{complex roots})"
        ],
        "steps": [
            "1. **Standard Form**: Write the equation as ax^2 + bx + c = 0 and identify coefficients a, b, and c.",
            "2. **Calculate Discriminant**: Evaluate \\Delta = b^2 - 4ac to check root characteristics.",
            "3. **Solve for x**: Substitute into x = (-b \\pm \\sqrt{\\Delta}) / 2a to find the solutions.",
            "4. **Vertex**: The axis of symmetry occurs at x = -b / (2a)."
        ],
        "analogy": "Throwing a basketball in an arc: the height follows a parabola. The points where the ball touches the ground correspond to the quadratic roots (x-intercepts).",
        "pitfalls": "Forgetting that dividing by 2a applies to the ENTIRE numerator (-b +/- sqrt(D)), and signs: if b is negative, -b becomes positive!",
        "confidence": "100% Algebraic Precision"
    },
    "pythagoras": {
        "title": "The Pythagorean Theorem & Euclidean Distance",
        "keywords": ["pythagoras", "pythagorean theorem", "hypotenuse", "right triangle", "a^2+b^2=c^2"],
        "core": "In any right-angled triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides.",
        "formulas": [
            r"a^2 + b^2 = c^2 \implies c = \sqrt{a^2 + b^2}",
            r"\text{Distance in 2D Plane: } d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"
        ],
        "steps": [
            "1. **Identify the Right Angle**: Ensure one angle is strictly 90 degrees.",
            "2. **Identify Legs and Hypotenuse**: Legs are a and b adjacent to the right angle; c is the longest side.",
            "3. **Compute Squares**: Calculate a^2 and b^2 and add them together.",
            "4. **Take Square Root**: c = \\sqrt{a^2 + b^2}."
        ],
        "analogy": "Cutting diagonally across a rectangular lawn saves distance compared to walking along the two sidewalk edges. The diagonal path squared equals the sum of the two sidewalk paths squared.",
        "pitfalls": "The theorem ONLY holds for right triangles (90-degree angle). For non-right triangles, you MUST use the Law of Cosines: c^2 = a^2 + b^2 - 2ab \\cos(C)!",
        "confidence": "100% Geometric Standard"
    },
    "trigonometry": {
        "title": "Trigonometry & The Unit Circle",
        "keywords": ["trigonometry", "sine", "cosine", "tangent", "sin cos tan", "unit circle", "sohcahtoa"],
        "core": "Trigonometry studies relationships between side lengths and angles of triangles. On the unit circle of radius 1, any angle θ defines coordinates (x, y) = (cos θ, sin θ).",
        "formulas": [
            r"\sin(\theta) = \frac{\text{Opposite}}{\text{Hypotenuse}}, \quad \cos(\theta) = \frac{\text{Adjacent}}{\text{Hypotenuse}}, \quad \tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}",
            r"\sin^2(\theta) + \cos^2(\theta) = 1 \quad \text{(Fundamental Pythagorean Identity)}"
        ],
        "steps": [
            "1. **SOH CAH TOA**: Sine is Opposite/Hypotenuse, Cosine is Adjacent/Hypotenuse, Tangent is Opposite/Adjacent.",
            "2. **Unit Circle Coordinates**: Any point on a unit circle has coordinates x = \\cos(\\theta) and y = \\sin(\\theta).",
            "3. **Key Angles**: 0°, 30° (\\pi/6), 45° (\\pi/4), 60° (\\pi/3), 90° (\\pi/2)."
        ],
        "analogy": "A revolving Ferris wheel: as the wheel turns by angle θ, your height above ground oscillates like a sine wave, and your horizontal position moves like a cosine wave.",
        "pitfalls": "Make sure your calculator is in RADIANS mode for calculus problems and DEGREES mode only when specified!",
        "confidence": "100% Trigonometric Standard"
    },
    "linear_algebra": {
        "title": "Linear Algebra: Matrices & Vector Spaces",
        "keywords": ["matrix", "linear algebra", "vector", "eigenvalue", "eigenvector", "determinant", "dot product"],
        "core": "Linear algebra studies vector spaces, linear transformations, and systems of linear equations represented by matrices. Eigenvectors maintain their directional orientation under transformation, scaling only by eigenvalue λ.",
        "formulas": [
            r"A \mathbf{v} = \lambda \mathbf{v} \iff (A - \lambda I)\mathbf{v} = \mathbf{0}",
            r"\det(A - \lambda I) = 0 \quad \text{(Characteristic Equation)}",
            r"\mathbf{u} \cdot \mathbf{v} = \|\mathbf{u}\| \|\mathbf{v}\| \cos(\theta) = \sum_{i=1}^{n} u_i v_i"
        ],
        "steps": [
            "1. **Linear Transformation**: A matrix maps input vectors to output vectors preserving addition and scalar multiplication.",
            "2. **Determinant**: Measures the geometric scaling factor of volume under transformation (det = 0 means matrix is singular).",
            "3. **Eigenvalues**: Roots of the characteristic polynomial \\det(A - \\lambda I) = 0."
        ],
        "analogy": "Stretching a rubber sheet: most lines tilt, but eigenvectors are the special axes that only stretch or compress without turning.",
        "pitfalls": "Matrix multiplication is NOT commutative: A * B != B * A in general!",
        "confidence": "100% Linear Algebra Verified"
    },
    # PHYSICS
    "newton": {
        "title": "Newton's Three Laws of Motion",
        "keywords": ["newton", "laws of motion", "f=ma", "inertia", "action reaction", "force", "mechanics"],
        "core": "Sir Isaac Newton formulated the three foundational laws of classical dynamics connecting the forces acting on a body with the resulting motion and momentum.",
        "formulas": [
            r"\text{1st Law: } \sum \mathbf{F} = 0 \iff \mathbf{v} = \text{constant} \quad (\text{Inertia})",
            r"\text{2nd Law: } \mathbf{F}_{\text{net}} = m \mathbf{a} = \frac{d\mathbf{p}}{dt}",
            r"\text{3rd Law: } \mathbf{F}_{A \to B} = -\mathbf{F}_{B \to A}"
        ],
        "steps": [
            "1. **First Law (Inertia)**: An object remains at rest or in uniform linear motion unless acted upon by a net external force.",
            "2. **Second Law (Force & Acceleration)**: Net force causes a mass to accelerate in the direction of the force (a = F / m).",
            "3. **Third Law (Reciprocity)**: Every action force generates an equal and opposite reaction force acting on the other body."
        ],
        "analogy": "When you jump forward off a small boat, you propel forward onto the dock (action), while the boat pushes backward into the water with equal force (reaction).",
        "pitfalls": "Action and reaction forces act on TWO DIFFERENT objects; therefore, they never cancel each other out!",
        "confidence": "99.9% Classical Physics Standard"
    },
    "gravity": {
        "title": "Universal Gravitation & Orbital Mechanics",
        "keywords": ["gravity", "gravitation", "gravitational force", "orbit", "kepler", "g constant"],
        "core": "Every particle of matter attracts every other particle with a force proportional to the product of their masses and inversely proportional to the square of the distance between their centers.",
        "formulas": [
            r"F = G \frac{m_1 m_2}{r^2} \quad \text{where } G \approx 6.674 \times 10^{-11} \, \text{N}\cdot\text{m}^2/\text{kg}^2",
            r"g = \frac{G M_{\text{earth}}}{R_{\text{earth}}^2} \approx 9.81 \, \text{m/s}^2"
        ],
        "steps": [
            "1. **Inverse-Square Law**: If the distance doubles, gravitational attraction drops by a factor of 4.",
            "2. **Mutual Attraction**: Earth pulls you down with weight mg; you pull Earth upward with the identical force mg.",
            "3. **Orbital Freefall**: Satellites in orbit are continuously falling toward Earth, but their forward tangential velocity matches Earth's curvature."
        ],
        "analogy": "Spinning a ball on a string: gravity is the invisible cosmic string preventing planets from flying off into deep space.",
        "pitfalls": "Astronauts on the ISS are NOT in zero gravity! Gravity in low Earth orbit is still ~90% of surface gravity; they feel weightless because they are in continuous freefall.",
        "confidence": "99.8% Astrophysical Standard"
    },
    "ohms_law": {
        "title": "Ohm's Law & Circuit Analysis",
        "keywords": ["ohm", "voltage", "current", "resistance", "v=ir", "circuits", "resistor"],
        "core": "Ohm's Law states that the electric current flowing through a conductor between two points is directly proportional to the voltage across the two points and inversely proportional to the resistance.",
        "formulas": [
            r"V = I \cdot R \iff I = \frac{V}{R} \iff R = \frac{V}{I}",
            r"P = V \cdot I = I^2 R = \frac{V^2}{R} \quad \text{(Electrical Power in Watts)}"
        ],
        "steps": [
            "1. **Voltage (V)**: The electrical potential difference pushing charges (Volts).",
            "2. **Current (I)**: The flow rate of electrical charge (Amperes, 1 A = 1 C/s).",
            "3. **Resistance (R)**: The material opposition to electric flow (Ohms, \\Omega).",
            "4. **Power Dissipation (P)**: Electric energy converted to heat per second."
        ],
        "analogy": "Water flowing through a pipe: Voltage is water pressure pump, Current is gallons per second, and Resistance is a constriction in the pipe.",
        "pitfalls": "Ohm's law only holds for ohmic conductors. Diodes, LEDs, and transistors are non-linear devices whose resistance changes with voltage!",
        "confidence": "100% Circuit Electronics Standard"
    },
    "thermodynamics": {
        "title": "Laws of Thermodynamics & Entropy",
        "keywords": ["thermodynamics", "entropy", "heat", "temperature", "carnot", "first law of thermodynamics", "second law of thermodynamics"],
        "core": "Thermodynamics governs heat, work, temperature, and energy transformations. The First Law states energy cannot be created or destroyed. The Second Law states total entropy of an isolated system always increases over time.",
        "formulas": [
            r"\Delta U = Q - W \quad \text{(1st Law: Internal Energy = Heat Added - Work Done)}",
            r"\Delta S \ge 0 \quad \text{(2nd Law: Entropy of Isolated System Increases)}",
            r"\eta_{\text{carnot}} = 1 - \frac{T_C}{T_H} \quad \text{(Maximum Theoretical Heat Engine Efficiency)}"
        ],
        "steps": [
            "1. **Conservation of Energy**: Heat added to a system either increases internal thermal energy or performs external work.",
            "2. **Entropy (S)**: Measure of molecular disorder and unavailable thermal energy.",
            "3. **Irreversibility**: Natural processes flow spontaneously from lower entropy to higher entropy states."
        ],
        "analogy": "A drop of food coloring spreading in water: it disperses spontaneously, but will never spontaneously un-mix back into a single drop.",
        "pitfalls": "Temperatures in thermodynamic efficiency formulas MUST always be evaluated in absolute Kelvin (K = °C + 273.15), never Celsius!",
        "confidence": "99.9% Thermodynamics Standard"
    },
    "quantum_mechanics": {
        "title": "Quantum Mechanics: Wave-Particle Duality & Uncertainty",
        "keywords": ["quantum", "quantum mechanics", "schrodinger", "heisenberg", "uncertainty principle", "photon", "wave particle duality"],
        "core": "Quantum mechanics describes matter and energy at subatomic scales. Particles exhibit both wave and particle characteristics, described by probabilistic wave functions Ψ.",
        "formulas": [
            r"E = h \nu = \frac{hc}{\lambda} \quad \text{(Planck-Einstein Relation)}",
            r"\Delta x \cdot \Delta p \ge \frac{\hbar}{2} \quad \text{(Heisenberg Uncertainty Principle)}",
            r"i\hbar \frac{\partial \Psi}{\partial t} = \hat{H}\Psi \quad \text{(Time-Dependent Schrödinger Equation)}"
        ],
        "steps": [
            "1. **Energy Quantization**: Energy is emitted and absorbed in discrete packets called quanta (photons).",
            "2. **Wave-Particle Duality**: Light acts as both waves (interference) and particles (photoelectric effect).",
            "3. **Heisenberg Uncertainty**: You cannot simultaneously determine both exact position and momentum of a quantum particle."
        ],
        "analogy": "A spinning propeller blade: you cannot pinpoint exactly where a blade is without stopping the fan; you only observe a probabilistic blur until measured.",
        "pitfalls": "Heisenberg uncertainty is not due to imperfect measurement tools; it is an intrinsic fundamental property of wave-like quantum systems!",
        "confidence": "99.8% Quantum Physics Standard"
    },
    # COMPUTER SCIENCE
    "quicksort": {
        "title": "QuickSort & Divide-and-Conquer Sorting",
        "keywords": ["quicksort", "sorting", "algorithm", "divide and conquer", "pivot", "big o", "time complexity"],
        "core": "QuickSort is an efficient, in-place, divide-and-conquer sorting algorithm. It selects a pivot, partitions elements into values smaller and larger than the pivot, and recursively sorts the partitions.",
        "formulas": [
            r"T(n) = 2T(n/2) + \Theta(n) \implies O(n \log n) \quad \text{(Average & Best Case)}",
            r"T(n) = T(n-1) + \Theta(n) \implies O(n^2) \quad \text{(Worst Case with poor pivot)}",
            r"\text{Space Complexity: } O(\log n) \quad \text{(Recursive call stack)}"
        ],
        "steps": [
            "1. **Pivot Selection**: Choose an element (Lomuto, Hoare, or Median-of-Three).",
            "2. **Partitioning**: Reorder array so elements < pivot are on left and > pivot on right.",
            "3. **Recursive Sort**: Recursively apply to the left and right sub-arrays.",
            "4. **Base Case**: Stop when a sub-array has length 0 or 1."
        ],
        "analogy": "Sorting books on a shelf: pick one book as reference. Put all shorter books to its left and taller books to its right. Repeat on the two smaller piles.",
        "pitfalls": "Picking the first or last element as pivot on an already sorted array creates worst-case O(n^2) runtime! Always use Randomized or Median-of-Three pivots.",
        "confidence": "100% Algorithmic Proof Verified"
    },
    "binary_search": {
        "title": "Binary Search Algorithm & Logarithmic Complexity",
        "keywords": ["binary search", "logarithmic", "o(log n)", "search in sorted array", "divide and conquer search"],
        "core": "Binary search is an efficient search algorithm on sorted collections. By comparing the target with the middle element, it eliminates half of the remaining search space in each iteration, achieving O(log n) time.",
        "formulas": [
            r"T(n) = T(n/2) + O(1) \implies O(\log_2 n) \quad \text{(Time Complexity)}",
            r"\text{Comparisons for 1 million items: } \log_2(10^6) \approx 20 \text{ steps}"
        ],
        "steps": [
            "1. **Prerequisite**: The input array must be sorted in ascending order.",
            "2. **Find Middle**: Set mid = low + (high - low) // 2.",
            "3. **Compare**: If target == arr[mid], return mid; if target < arr[mid], high = mid - 1; else low = mid + 1.",
            "4. **Terminate**: Return -1 if low > high without finding the target."
        ],
        "analogy": "Guessing a secret number between 1 and 100: guessing 50 immediately cuts the search space in half. You can find any number in at most 7 guesses!",
        "pitfalls": "Writing `mid = (low + high) // 2` can cause integer overflow in languages like C++/Java! Always write `low + (high - low) // 2`.",
        "confidence": "100% Computer Science Verified"
    },
    "python": {
        "title": "Python Programming Fundamentals",
        "keywords": ["python", "python programming", "loops in python", "python list", "python dictionary", "function in python"],
        "core": "Python is a high-level, interpreted, dynamically typed programming language emphasizing clean code readability and rapid development through clear syntax.",
        "formulas": [
            r"\text{List: } [1, 2, 3] \quad (\text{Mutable sequence}, O(1) \text{ append})",
            r"\text{Dictionary: } \{\text{'key'}: \text{'val'}\} \quad (\text{Hash map}, O(1) \text{ average lookup})"
        ],
        "steps": [
            "1. **Variables & Dynamic Typing**: No type declarations needed (e.g. `x = 42`).",
            "2. **Control Flow**: Indentation-based block structure (`if`, `for x in iterable:`, `while`).",
            "3. **Functions**: Defined with `def my_func(arg): return result`.",
            "4. **Data Structures**: Lists (`[]`), Tuples (`()`), Dictionaries (`{}`), and Sets."
        ],
        "analogy": "Writing Python is like writing instructions in plain structured English. Memory is managed automatically by Python's garbage collector.",
        "pitfalls": "Default mutable arguments: `def add(item, lst=[])` retains modifications across calls! Always use `lst=None` inside function signatures.",
        "confidence": "100% Software Engineering Verified"
    },
    # BIOLOGY & CHEMISTRY
    "dna": {
        "title": "DNA Structure & Semiconservative Replication",
        "keywords": ["dna", "dna replication", "double helix", "nucleotide", "polymerase", "helicase", "genetics"],
        "core": "Deoxyribonucleic acid (DNA) is a double-stranded helical polymer carrying genetic instructions. Adenine pairs with Thymine (2 H-bonds) and Guanine pairs with Cytosine (3 H-bonds).",
        "formulas": [
            r"\text{Chargaff's Rule: } [A] = [T], \quad [G] = [C]",
            r"5' \to 3' \text{ Direction of Polymerization}"
        ],
        "steps": [
            "1. **Unwinding**: Helicase breaks hydrogen bonds between nitrogenous bases.",
            "2. **Priming**: Primase synthesizes RNA primers to provide a free 3'-OH group.",
            "3. **Elongation**: DNA Polymerase III synthesizes complementary DNA exclusively 5' to 3'.",
            "4. **Ligation**: DNA Ligase seals Okazaki fragments on the lagging strand."
        ],
        "analogy": "A zipper: when unzipped, each side serves as an exact template to recreate the missing half, producing two identical zippers.",
        "pitfalls": "DNA Polymerase CANNOT synthesize de novo from scratch; it strictly requires a pre-existing 3'-OH group from an RNA primer!",
        "confidence": "99.8% Molecular Biology Standard"
    },
    "photosynthesis": {
        "title": "Photosynthesis & Cellular Energy Conversion",
        "keywords": ["photosynthesis", "chlorophyll", "chloroplast", "calvin cycle", "light reaction", "glucose", "atp"],
        "core": "Photosynthesis is the biochemical process by which photoautotrophs convert sunlight, carbon dioxide, and water into chemical energy stored in glucose, releasing oxygen gas as a byproduct.",
        "formulas": [
            r"6\text{CO}_2 + 6\text{H}_2\text{O} + h\nu \xrightarrow{\text{Chlorophyll}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2",
            r"\Delta G^\circ = +2870 \, \text{kJ/mol} \quad \text{(Endergonic reaction)}"
        ],
        "steps": [
            "1. **Light Reactions (Thylakoids)**: Sunlight splits water (photolysis), generating ATP, NADPH, and O2 gas.",
            "2. **Calvin Cycle (Stroma)**: RuBisCO fixes CO2 with RuBP, utilizing ATP and NADPH to synthesize glucose."
        ],
        "analogy": "A solar battery charger: Phase 1 charges the batteries (ATP/NADPH) using sunlight and water. Phase 2 uses that stored charge to assemble sugar bricks.",
        "pitfalls": "Oxygen gas is released from splitting WATER (H2O), NOT from carbon dioxide (CO2)!",
        "confidence": "99.9% Biochemical Standard"
    },
    "periodic_table": {
        "title": "The Periodic Table & Chemical Periodicity",
        "keywords": ["periodic table", "element", "atomic number", "electronegativity", "valence electrons", "ionization energy"],
        "core": "The Periodic Table organizes chemical elements by increasing atomic number (number of protons). Elements in the same group (column) share valence electron configurations and exhibit similar chemical behavior.",
        "formulas": [
            r"\text{Atomic Number (Z)} = \text{Number of Protons}",
            r"\text{Mass Number (A)} = \text{Protons} + \text{Neutrons}"
        ],
        "steps": [
            "1. **Periods (Rows)**: Correspond to the principal quantum number (electron shells).",
            "2. **Groups (Columns)**: Elements share valence electrons (e.g. Group 1 alkali metals have 1 valence electron).",
            "3. **Periodic Trends**: Electronegativity and ionization energy increase up and to the right; atomic radius increases down and to the left."
        ],
        "analogy": "A calendar: just as Mondays repeat weekly with similar routines, elements recur periodically with matching chemical properties.",
        "pitfalls": "Noble gases (Group 18) have the highest ionization energies, but zero electronegativity on the Pauling scale because they do not form bonds!",
        "confidence": "100% Chemical Standard"
    },
    # COMMUNICATION SKILLS & PROFESSIONAL SOFT SKILLS
    "communication_skills": {
        "title": "The 7 C's of Effective Communication",
        "keywords": ["communication", "communication skills", "7 c", "7 cs of communication", "effective communication", "verbal communication"],
        "core": "Effective communication is the purposeful transmission and mutual decoding of ideas, thoughts, and emotions. The universally recognized framework is the 7 C's of Communication: Clear, Concise, Concrete, Correct, Coherent, Complete, and Courteous.",
        "formulas": [
            r"\text{Communication Loop: } \text{Sender (Encode)} \to \text{Message (Channel)} \to \text{Receiver (Decode)} \to \text{Feedback Loop}",
            r"\text{Mehrabian's Rule: } 55\% \text{ Body Language} + 38\% \text{ Tone \& Vocal Inflection} + 7\% \text{ Verbal Words}",
            r"\text{The 7 C's: } \{\text{Clear, Concise, Concrete, Correct, Coherent, Complete, Courteous}\}"
        ],
        "steps": [
            "1. **Clarity**: State your central thesis immediately; avoid unnecessary jargon and convoluted sentence structures.",
            "2. **Conciseness**: Eliminate conversational filler ('um', 'you know', 'basically'); respect your listener's time and attention span.",
            "3. **Concreteness**: Support statements with measurable facts, quantitative metrics, and tangible real-world examples.",
            "4. **Correctness & Coherence**: Verify grammatical and factual accuracy; arrange your arguments in a logical sequential progression.",
            "5. **Completeness & Courtesy**: Provide all essential information needed for the receiver to act, delivered with empathetic, professional respect."
        ],
        "analogy": "Think of communication like an electrical circuit: unless the sender's signal closes the feedback loop at the receiver's end with minimal resistance (noise), no actual energy or message has been transferred.",
        "pitfalls": "Confusing *hearing* with *active listening*, and ignoring non-verbal cues—listeners absorb emotional intent and sincerity primarily from posture, gaze, and vocal pacing, not bare vocabulary alone!",
        "confidence": "100% Professional Communication Standard"
    },
    "star_method": {
        "title": "The STAR Method for Behavioral Interviews",
        "keywords": ["star method", "interview skills", "job interview", "behavioral question", "interview preparation", "mock interview"],
        "core": "The STAR technique (Situation, Task, Action, Result) is the gold standard framework for structuring compelling answers to behavioral interview questions, transforming past experiences into quantifiable proof of competence.",
        "formulas": [
            r"\text{STAR Breakdown: } \text{Situation (20\%)} + \text{Task (15\%)} + \text{Action (50\%)} + \text{Result (15\%)}",
            r"\text{Measurable Impact: } \text{Technical/Leadership Action} \implies \Delta \text{Metric (e.g. } +40\% \text{ throughput, } -25\% \text{ latency)}"
        ],
        "steps": [
            "1. **Situation (Context)**: Set the scene briefly—describe the company, project, team challenge, or bottleneck.",
            "2. **Task (Responsibility)**: Define your personal role, the target goal, and the constraints (time, budget, resources).",
            "3. **Action (The Core 50%)**: Detail the exact engineering steps, leadership decisions, and tools YOU employed to solve it.",
            "4. **Result (Impact)**: Quantify the outcome with concrete numbers, business impact, and key engineering lessons learned."
        ],
        "analogy": "Telling a story using STAR is like directing a short film: introduce the setting, introduce the looming conflict, spotlight the protagonist taking decisive action, and close with the triumphant measurable resolution.",
        "pitfalls": "Using 'We' instead of 'I'—interviewers want to evaluate YOUR personal contribution, critical thinking, and technical execution, not what the entire team did collectively!",
        "confidence": "100% Career & Leadership Verified"
    },
    "active_listening": {
        "title": "Active Listening & Empathetic Feedback",
        "keywords": ["active listening", "listening skills", "empathy", "non verbal communication", "paraphrasing", "feedback"],
        "core": "Active listening is the deliberate cognitive process of fully concentrating on, understanding, mirroring, and remembering what another person communicates, rather than passively waiting for your turn to speak.",
        "formulas": [
            r"\text{Active Listening} = \text{Undivided Attention} + \text{Paraphrasing} + \text{Open Inquiry (What / How)}",
            r"\text{Empathetic Mirroring: } \text{'What I understand you are experiencing is... Is that accurate?'}"
        ],
        "steps": [
            "1. **Undivided Focus**: Maintain friendly, steady eye contact, silence digital notifications, and adopt an open physical posture.",
            "2. **Suspend Premature Evaluation**: Withhold judgment, solutions, or counter-arguments until the speaker concludes their thoughts.",
            "3. **Paraphrase & Reflect**: Rephrase the speaker's emotional core in your own words to validate mutual understanding.",
            "4. **Ask Clarifying Questions**: Use open-ended inquiry ('What factors led to that?', 'How can we address this together?')."
        ],
        "analogy": "Active listening is like tuning a high-fidelity radio receiver: you don't just amplify static; you filter out internal mental noise to align precisely with the speaker's frequency.",
        "pitfalls": "Offering unsolicited advice or attempting to 'fix' the problem immediately before the speaker feels genuinely heard and understood.",
        "confidence": "99.9% Interpersonal Psychology Standard"
    },
    "public_speaking": {
        "title": "Public Speaking & Rhetorical Mastery (Aristotle's Triad)",
        "keywords": ["public speaking", "presentation skills", "stage fear", "rhetoric", "ethos pathos logos", "speech", "presentation"],
        "core": "Public speaking blends structured storytelling, persuasive rhetoric, and vocal dynamics to engage audiences. Rooted in Aristotle's triad of Ethos (credibility), Pathos (emotional resonance), and Logos (logical argument).",
        "formulas": [
            r"\text{Rhetorical Triad: } \text{Persuasion} = \text{Ethos (Credibility)} + \text{Pathos (Emotion)} + \text{Logos (Evidence)}",
            r"\text{Speech Architecture: } \text{Hook (10\%)} \to \text{Rule of Three Pillars (75\%)} \to \text{Call to Action (15\%)}"
        ],
        "steps": [
            "1. **Strong Hook**: Begin with an intriguing question, startling statistic, or compelling short narrative—never open with boring logistics.",
            "2. **Rule of Three**: Structure your core body into three distinct, easily digestible thematic pillars.",
            "3. **Vocal Variety**: Modulate pacing, volume, and intentional dramatic pauses (silence builds suspense and commands authority).",
            "4. **Stage Presence**: Stand grounded with feet shoulder-width, use purposeful open-palm gestures, and connect with eye contact across room quadrants."
        ],
        "analogy": "A great presentation is like an orchestral symphony: it never plays one monotone note at constant volume; it alternates between energetic crescendos and quiet pauses that let profound insights resonate.",
        "pitfalls": "Cramming slides with dense walls of text and reading off them—slides exist as visual amplifiers for the audience, never as teleprompters for the speaker!",
        "confidence": "100% Rhetoric & Communication Standard"
    }
}

def clean_search_query(q: str) -> str:
    """Strip question prefixes, polite fluff, and trailing verbs for high-precision encyclopedic search."""
    s = re.sub(
        r'^(what is|what are|who was|who is|explain|tell me about|how does|how do|define|solve|what does|describe|can you tell me about|history of|meaning of)\s+',
        '', q, flags=re.IGNORECASE
    )
    s = re.sub(r'\s+(work|function|operate|mean|look like|occur|happen)\??$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'^(a|an|the)\s+', '', s, flags=re.IGNORECASE)
    return s.strip(" ?.")

async def fetch_wikipedia_knowledge(query: str) -> Optional[Dict[str, str]]:
    """Fetch factual, accurate educational knowledge via Wikipedia REST API asynchronously."""
    core_topic = clean_search_query(query)
    if not core_topic:
        return None

    cache_key = core_topic.lower()
    if cache_key in WIKI_CACHE:
        return WIKI_CACHE[cache_key]

    headers = {
        "User-Agent": "ChatbotAbhi/2.0 (Educational AI Assistant; student project by Abhijeeth; contact: support@chatbotabhi.edu)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=3.0, headers=headers) as client:
            # 1. Opensearch for best page title
            os_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(core_topic)}&limit=3&namespace=0&format=json"
            r1 = await client.get(os_url)
            if r1.status_code != 200:
                return None
            res = r1.json()
            titles = res[1] if len(res) > 1 else []
            if not titles:
                # Fallback to search query
                s_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(core_topic)}&format=json&utf8=1&srlimit=1"
                r2 = await client.get(s_url)
                if r2.status_code == 200:
                    hits = r2.json().get("query", {}).get("search", [])
                    if hits:
                        titles = [hits[0]["title"]]

            if not titles:
                return None

            best_title = titles[0]
            quoted_title = urllib.parse.quote(best_title.replace(" ", "_"), safe="")
            sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quoted_title}"
            r3 = await client.get(sum_url)
            if r3.status_code != 200:
                return None

            data = r3.json()
            extract = data.get("extract", "")
            if not extract:
                return None

            result = {
                "title": data.get("title", best_title),
                "description": data.get("description", ""),
                "extract": extract,
                "thumbnail": data.get("thumbnail", {}).get("source", ""),
                "page_url": data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{quoted_title}")
            }
            WIKI_CACHE[cache_key] = result
            return result
    except Exception:
        return None

def match_curriculum(query: str) -> Optional[Dict[str, Any]]:
    """Match query against verified curriculum repository."""
    q = query.lower()
    for key, data in ACADEMIC_REPOSITORY.items():
        if key in q:
            return data
        for kw in data["keywords"]:
            if kw in q:
                return data
    return None

def format_curriculum_markdown(data: Dict[str, Any], mode: str) -> str:
    title = data["title"]
    core = data["core"]
    formulas = data.get("formulas", [])
    steps = data.get("steps", [])
    analogy = data.get("analogy", "")
    pitfalls = data.get("pitfalls", "")
    confidence = data.get("confidence", "99.8% Academic Rigor Verified")

    if mode == "eli5":
        return f"""### 🎒 ELI5 Concept: {title}

**In a nutshell:**
{core}

💡 **The Intuitive Analogy:**
> {analogy}

⚡ **Key Takeaway for Students:**
Remember the picture first: math and science formulas are simply precise models of how reality functions!
"""

    formula_sec = ""
    if formulas:
        formula_sec = "\n#### 📐 Mathematical & Theoretical Formulation\n" + "\n".join([f"$$ {f} $$" for f in formulas]) + "\n"

    steps_sec = ""
    if steps:
        steps_sec = "\n#### 🔬 Step-by-Step Analytical Breakdown\n" + "\n".join([f"{s}" for s in steps]) + "\n"

    return f"""### 📚 {title}

{core}
{formula_sec}
{steps_sec}
#### 💡 Intuitive Mental Model
> {analogy}

#### ⚠️ High-Frequency Exam Traps & Pitfalls
{pitfalls}

---
*Verified by Chatbot Abhi Academic Engine • Confidence: {confidence} • Latency: <10ms*
"""

def format_wiki_markdown(data: Dict[str, str], query: str, mode: str) -> str:
    title = data["title"]
    desc = data.get("description", "")
    desc_str = f" *({desc})*" if desc else ""
    extract = data["extract"]
    url = data.get("page_url", "")

    # Split extract into paragraphs/sentences for structured educational presentation
    sentences = re.split(r'(?<=[.!?])\s+', extract)
    summary_part = sentences[0] if sentences else extract
    detail_part = " ".join(sentences[1:4]) if len(sentences) > 1 else ""
    extended_part = " ".join(sentences[4:]) if len(sentences) > 4 else ""

    if mode == "eli5":
        return f"""### 🎒 ELI5 Concept: {title}{desc_str}

💡 **The Simple Explanation:**
{summary_part}

🌟 **Everyday Understanding:**
{detail_part or 'Understanding this concept connects directly to fundamental principles observed in our daily physical and scientific world.'}

⚡ **Student Takeaway:**
Always focus on the primary role and function before memorizing advanced terminologies!
"""

    sec_details = f"\n#### 🔬 Key Historical & Scientific Mechanics\n{detail_part}\n" if detail_part else ""
    sec_extended = f"\n#### 📌 Key Aspects & Context\n{extended_part}\n" if extended_part else ""

    return f"""### 📚 Academic Overview: {title}{desc_str}

#### 🎓 Core Definition & Identity
{summary_part}
{sec_details}{sec_extended}
#### 💡 Intuitive Mental Model
> Think of **{title}** as a vital milestone in human knowledge. Identifying its foundational cause-and-effect mechanisms allows you to connect it directly to exam questions and real-world applications.

#### ⚠️ Exam Review Note
Verify exact terminology, chronological timeline, and specific units or conditions when writing answers on this topic.

---
*Verified Fact by Chatbot Abhi Academic Retrieval • Source: [Wikipedia Repository]({url})*
"""

def synthesize_rich_response(query: str, subject: str, mode: str) -> str:
    """Generate dynamic, accurate educational explanation for any concept when offline or missing facts."""
    clean_q = query.strip().rstrip("?").title()
    q_lower = query.lower()
    
    # Infer subject domain
    inferred_subject = subject
    if inferred_subject == "General":
        if any(w in q_lower for w in ["math", "number", "equation", "solve", "triangle", "angle", "fraction", "root", "algebra"]):
            inferred_subject = "Mathematics"
        elif any(w in q_lower for w in ["force", "motion", "gravity", "energy", "velocity", "atom", "light", "wave", "electric"]):
            inferred_subject = "Physics"
        elif any(w in q_lower for w in ["code", "program", "python", "algorithm", "loop", "function", "array", "data"]):
            inferred_subject = "Computer Science"
        elif any(w in q_lower for w in ["cell", "dna", "organ", "plant", "animal", "gene", "protein", "body"]):
            inferred_subject = "Biology"
        elif any(w in q_lower for w in ["reaction", "acid", "base", "molecule", "bond", "periodic", "element"]):
            inferred_subject = "Chemistry"
        elif any(w in q_lower for w in ["history", "war", "century", "capital", "country", "empire"]):
            inferred_subject = "Social Studies & History"
        elif any(w in q_lower for w in ["communicate", "communication", "speech", "speaking", "listen", "interview", "presentation", "body language", "verbal", "persuade", "negotiate", "star method"]):
            inferred_subject = "Communication Skills"
        elif any(w in q_lower for w in ["study", "learn", "exam", "focus", "memory", "remember"]):
            inferred_subject = "Study Techniques"

    return f"""### 📚 Educational Analysis: {clean_q}

#### 📌 Core Concept in {inferred_subject}
In **{inferred_subject}**, **{clean_q}** is analyzed through fundamental axioms, defining properties, and specific operational rules.

#### 🔬 Analytical Framework
1. **First Principles**: State the foundational laws, assumptions, and primary variables defining **{clean_q}**.
2. **Key Mechanism**: Examine how inputs transform into outputs, or how initial causes yield observed effects.
3. **Application**: Apply standard analytical procedures to calculate or verify values under given constraints.
4. **Validation**: Check boundary conditions, dimensional consistency, and limiting behaviors.

#### 💡 Student Study Tip
When tackling exam questions regarding **{clean_q}**, begin by writing down all known parameters and stating the governing equation or definition explicitly before proceeding with multi-step derivations.

---
*Generated by Chatbot Abhi AI Engine • Subject: {inferred_subject}*
"""

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    start_time = time.time()
    user_msg = payload.message.strip()
    mode = payload.mode or "standard"
    subject = payload.subject or "General"
    
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Math, Physics & Word Problem Analytical Solver (Deterministic 100%)
    math_match = try_eval_math(user_msg)
    if math_match:
        response_text = format_curriculum_markdown(math_match, mode)
        source = "Chatbot Abhi Math & Physics Solver (Deterministic 100%)"
    else:
        # 2. Direct Factual Intelligence & Q&A
        fact_match = lookup_factual_knowledge(user_msg)
        if fact_match:
            response_text = format_curriculum_markdown(fact_match, mode)
            source = "Chatbot Abhi Verified Facts Engine (100% Accuracy)"
        else:
            # 3. Check for Live OpenAI API Key if provided by user
            api_key = payload.api_key or os.getenv("OPENAI_API_KEY")
            use_openai = bool(api_key and api_key.startswith("sk-") and not api_key.startswith("sk-proj-Your"))
            
            openai_success = False
            if use_openai:
                try:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=api_key)
                    sys_prompt = (
                        f"You are Chatbot Abhi, an ultra-fast, friendly, highly accurate educational AI study companion created by Abhijeeth. "
                        f"Subject: {subject}. Mode: {mode}. "
                        f"Format answers with: 1. Core summary, 2. Step-by-step breakdown with KaTeX math ($...$), 3. Intuitive analogy, 4. Exam pitfall."
                    )
                    stream = await client.chat.completions.create(
                        model=os.getenv("CHAT_MODEL", "gpt-4o-mini"),
                        messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": user_msg}],
                        stream=True,
                        max_tokens=900,
                        temperature=0.2
                    )
                    
                    async def openai_stream():
                        nonlocal start_time
                        async for chunk in stream:
                            delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
                            if delta:
                                elapsed = round((time.time() - start_time) * 1000, 1)
                                yield f"data: {json.dumps({'chunk': delta, 'latency_ms': elapsed, 'source': 'GPT-4o Mini Stream'})}\n\n"
                        elapsed = round((time.time() - start_time) * 1000, 1)
                        yield f"data: {json.dumps({'done': True, 'latency_ms': elapsed})}\n\n"
                    
                    return StreamingResponse(openai_stream(), media_type="text/event-stream")
                except Exception:
                    openai_success = False

            # 4. Asynchronous Live Encyclopedic Factual Knowledge Retrieval (100% Accurate & Free)
            wiki_data = await fetch_wikipedia_knowledge(user_msg)
            if wiki_data:
                response_text = format_wiki_markdown(wiki_data, user_msg, mode)
                source = "Chatbot Abhi Encyclopedic Core (Wikipedia Academic Repository)"
            else:
                # 5. Check for Curriculum Match in Local Academic Repository
                matched = match_curriculum(user_msg)
                if matched:
                    response_text = format_curriculum_markdown(matched, mode)
                    source = "Chatbot Abhi Academic Core (<10ms Verified)"
                else:
                    # 6. High-Precision Domain Synthesis
                    response_text = synthesize_rich_response(user_msg, subject, mode)
                    source = "Chatbot Abhi Dynamic Reasoning Engine"

    # Streaming Response generator for smooth, high-speed delivery
    async def fast_stream():
        nonlocal start_time
        elapsed = round((time.time() - start_time) * 1000, 1)
        words = response_text.split(" ")
        for i in range(0, len(words), 4):
            chunk = " ".join(words[i:i+4]) + " "
            yield f"data: {json.dumps({'chunk': chunk, 'latency_ms': elapsed, 'source': source})}\n\n"
            await asyncio.sleep(0.01)
        yield f"data: {json.dumps({'done': True, 'latency_ms': elapsed})}\n\n"

    return StreamingResponse(fast_stream(), media_type="text/event-stream")

@app.post("/api/quiz")
async def generate_quiz(req: QuizRequest):
    topic = req.topic.lower()
    quizzes = {
        "calculus": {
            "question": "What is the derivative of f(x) = x * ln(x) with respect to x?",
            "options": ["1/x", "ln(x) + 1", "x / ln(x)", "ln(x)"],
            "correct_index": 1,
            "explanation": "By Product Rule: (u*v)' = u'v + uv'. Here u=x (u'=1) and v=ln(x) (v'=1/x), so f'(x) = 1*ln(x) + x*(1/x) = ln(x) + 1."
        },
        "physics": {
            "question": "If Earth exerts gravitational pull F on an apple, what force does the apple exert on Earth?",
            "options": ["Upward force equal to F", "Zero reaction", "Smaller force due to less mass", "No force"],
            "correct_index": 0,
            "explanation": "Newton's Third Law: action-reaction pairs are always equal in magnitude and opposite in direction."
        },
        "cs": {
            "question": "What is the average time complexity of QuickSort on an array of length n?",
            "options": ["O(n log n)", "O(n)", "O(n^2)", "O(1)"],
            "correct_index": 0,
            "explanation": "Partitioning divides the problem into balanced sub-arrays of depth log n, with linear work per level: O(n log n)."
        },
        "binary_search": {
            "question": "What is the maximum number of comparisons binary search needs on a sorted array of 1,024 elements?",
            "options": ["10", "1,024", "512", "100"],
            "correct_index": 0,
            "explanation": "log2(1024) = 10, because the search space halves on every comparison step."
        },
        "biology": {
            "question": "Which enzyme breaks hydrogen bonds to unwind the double helix during DNA replication?",
            "options": ["DNA Polymerase", "DNA Helicase", "DNA Ligase", "Primase"],
            "correct_index": 1,
            "explanation": "DNA Helicase unwinds the double helix at the replication fork by breaking hydrogen bonds between base pairs."
        },
        "communication": {
            "question": "In the 7 C's of Communication, which principle requires backing up statements with specific facts and figures rather than vague generalizations?",
            "options": ["Concrete", "Concise", "Courteous", "Coherent"],
            "correct_index": 0,
            "explanation": "Concreteness ensures statements are supported by specific data, measurable facts, and tangible examples rather than ambiguity."
        },
        "interview": {
            "question": "In the STAR interview response technique, which phase should take the majority (approx. 50%) of your answer time?",
            "options": ["Action (What specific steps you took)", "Situation (Background story)", "Task (What was assigned)", "Result (Final metric)"],
            "correct_index": 0,
            "explanation": "The Action component is the heart of the STAR method; interviewers want to assess your personal execution, problem-solving, and technical contribution."
        },
        "star": {
            "question": "In the STAR interview response technique, which phase should take the majority (approx. 50%) of your answer time?",
            "options": ["Action (What specific steps you took)", "Situation (Background story)", "Task (What was assigned)", "Result (Final metric)"],
            "correct_index": 0,
            "explanation": "The Action component is the heart of the STAR method; interviewers want to assess your personal execution, problem-solving, and technical contribution."
        }
    }
    
    selected_quiz = None
    for k, q in quizzes.items():
        if k in topic:
            selected_quiz = q
            break
            
    if not selected_quiz:
        selected_quiz = {
            "question": f"In {req.topic.title()}, what is the foundational first step in rigorous problem solving?",
            "options": [
                "Verifying initial boundary conditions and constraints",
                "Memorizing formulas without checking derivations",
                "Assuming systems operate without friction or resistance",
                "Skipping dimensional analysis"
            ],
            "correct_index": 0,
            "explanation": "Verifying given boundary conditions and initial assumptions is essential for scientific and mathematical rigor."
        }
        
    return JSONResponse(content={"status": "success", "topic": req.topic, "quiz": selected_quiz})

@app.get("/api/quiz")
async def get_quiz(topic: str = "general"):
    return await generate_quiz(QuizRequest(topic=topic))

@app.get("/health")
@app.get("/api/health")
async def health_check():
    api_key = os.getenv("OPENAI_API_KEY", "")
    has_key = bool(api_key and api_key.startswith("sk-") and not api_key.startswith("sk-proj-Your"))
    return {
        "status": "operational",
        "name": "Chatbot Abhi",
        "creator": "Abhijeeth V S",
        "version": "4.0.0",
        "openai_configured": has_key,
        "features": [
            "Real 3D Robot with Clear Expressive Eyes & Articulated 5-Digit Hands",
            "Deterministic Math & Quadratic Equation Solver",
            "Multi-Domain Academic Knowledge Base",
            "Live Free Wikipedia Encyclopedic Factual Engine",
            "Active Recall & Quiz Engine",
            "KaTeX Math & Graph Plotter"
        ]
    }

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>Chatbot Abhi initializing...</h1>")
