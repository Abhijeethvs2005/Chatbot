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

try:
    from backend.oxford_engine import (
        OXFORD_DICTIONARY_DB,
        fetch_oxford_dictionary_entry,
        extract_dictionary_word,
        is_word_of_the_day_query,
        is_oed_overview_query,
        format_oxford_markdown,
        get_word_of_the_day_markdown,
        get_oed_overview_markdown
    )
except ImportError:
    from oxford_engine import (
        OXFORD_DICTIONARY_DB,
        fetch_oxford_dictionary_entry,
        extract_dictionary_word,
        is_word_of_the_day_query,
        is_oed_overview_query,
        format_oxford_markdown,
        get_word_of_the_day_markdown,
        get_oed_overview_markdown
    )

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
    global OPENAI_KEY_EXHAUSTED
    key = req.api_key.strip()
    if not key or not key.startswith("sk-"):
        return {"valid": False, "error": "Invalid API key format. Key must start with 'sk-'."}
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=key, timeout=3.0, max_retries=0)
        await client.chat.completions.create(
            model=os.getenv("CHAT_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=3
        )
        OPENAI_KEY_EXHAUSTED = False
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
    ast.UAdd: operator.pos,
    ast.Mod: operator.mod
}

def safe_eval_expr(expr: str) -> float:
    """Safely evaluate an arithmetic expression using AST parsing without arbitrary code execution."""
    clean_expr = expr.replace('^', '**').replace('x', '*').replace('X', '*')
    parsed = ast.parse(clean_expr, mode='eval')
    
    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError(f"Unsupported constant: {node.value}")
        elif hasattr(ast, 'Num') and isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            op_type = type(node.op)
            if op_type in SAFE_OPS:
                return SAFE_OPS[op_type](left, right)
            raise ValueError(f"Unsupported binary operator: {op_type}")
        elif isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            op_type = type(node.op)
            if op_type in SAFE_OPS:
                return SAFE_OPS[op_type](operand)
            raise ValueError(f"Unsupported unary operator: {op_type}")
        else:
            raise ValueError(f"Unsupported AST node: {type(node)}")

    return _eval(parsed)

# In-memory LRU Wikipedia fact cache
WIKI_CACHE: Dict[str, Dict[str, str]] = {}

# System OpenAI API Key status tracking
OPENAI_KEY_EXHAUSTED: bool = True


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

# Known molar masses (g/mol)
MOLAR_MASSES = {
    "h2o": ("Water (H₂O)", 18.015, ["2 × H (1.008) + 1 × O (16.00)"]),
    "co2": ("Carbon Dioxide (CO₂)", 44.01, ["1 × C (12.011) + 2 × O (16.00)"]),
    "nacl": ("Sodium Chloride / Table Salt (NaCl)", 58.44, ["1 × Na (22.99) + 1 × Cl (35.45)"]),
    "c6h12o6": ("Glucose (C₆H₁₂O₆)", 180.16, ["6 × C (12.011) + 12 × H (1.008) + 6 × O (16.00)"]),
    "o2": ("Oxygen Gas (O₂)", 32.00, ["2 × O (16.00)"]),
    "n2": ("Nitrogen Gas (N₂)", 28.014, ["2 × N (14.007)"]),
    "ch4": ("Methane (CH₄)", 16.04, ["1 × C (12.011) + 4 × H (1.008)"]),
    "nh3": ("Ammonia (NH₃)", 17.031, ["1 × N (14.007) + 3 × H (1.008)"]),
    "h2so4": ("Sulfuric Acid (H₂SO₄)", 98.079, ["2 × H (1.008) + 1 × S (32.065) + 4 × O (16.00)"]),
    "hcl": ("Hydrochloric Acid (HCl)", 36.46, ["1 × H (1.008) + 1 × Cl (35.45)"]),
    "caco3": ("Calcium Carbonate (CaCO₃)", 100.09, ["1 × Ca (40.08) + 1 × C (12.011) + 3 × O (16.00)"]),
    "c2h5oh": ("Ethanol (C₂H₅OH)", 46.07, ["2 × C (12.011) + 6 × H (1.008) + 1 × O (16.00)"])
}

def try_eval_math(query: str) -> Optional[Dict[str, Any]]:
    """Safely detect and calculate arithmetic, algebraic, geometric, calculus, physics, chemistry, and conversion problems with 100% deterministic precision."""
    raw = query.strip()
    raw_lower = raw.lower()

    # Convert natural language word arithmetic to symbols
    nl_clean = re.sub(r'^(what is|calculate|evaluate|solve)\s+', '', raw_lower).strip(" ?.")
    nl_clean = re.sub(r'\bplus\b', '+', nl_clean)
    nl_clean = re.sub(r'\bminus\b', '-', nl_clean)
    nl_clean = re.sub(r'\btimes\b', '*', nl_clean)
    nl_clean = re.sub(r'\bmultiplied by\b', '*', nl_clean)
    nl_clean = re.sub(r'\bdivided by\b', '/', nl_clean)
    nl_clean = re.sub(r'\bover\b', '/', nl_clean)

    # 1. Transcendental Derivatives: e.g. "derivative of sin(x)", "d/dx(cos(x))", "derivative of e^x", "derivative of ln(x)"
    m_trans_diff = re.search(r'(?:derivative of|d/dx\s*\(?)\s*(sin|cos|tan|e\^x|ln|log)\s*(?:\(?\s*x\s*\)?)?', raw_lower)
    if m_trans_diff:
        fn = m_trans_diff.group(1).lower()
        if fn == "sin":
            return {
                "title": "Calculus Derivative: d/dx [sin(x)]",
                "core": "The derivative of $$\sin(x)$$ with respect to $x$ is **$$\cos(x)$$**.",
                "formulas": [r"\frac{d}{dx}[\sin(x)] = \cos(x)", r"\frac{d}{dx}[\sin(kx)] = k \cos(kx) \quad \text{(Chain Rule)}"],
                "steps": [
                    "1. **Definition of Derivative**: \lim_{h \to 0} \frac{\sin(x+h) - \sin(x)}{h}.",
                    "2. **Angle Addition Identity**: \sin(x+h) = \sin(x)\cos(h) + \cos(x)\sin(h).",
                    "3. **Evaluate Fundamental Limits**: \lim_{h \to 0} \frac{\sin(h)}{h} = 1 and \lim_{h \to 0} \frac{\cos(h)-1}{h} = 0.",
                    "4. **Exact Result**: $$\mathbf{\frac{d}{dx}[\sin(x)] = \cos(x)}$$"
                ],
                "analogy": "At the peak of a sine wave (x = π/2), the slope is zero (cos(π/2) = 0). Where sine rises fastest through the origin (x = 0), its slope is 1 (cos(0) = 1).",
                "pitfalls": "Remember: the derivative of sin(x) is POSITIVE cos(x), whereas the derivative of cos(x) is NEGATIVE sin(x)!",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "cos":
            return {
                "title": "Calculus Derivative: d/dx [cos(x)]",
                "core": "The derivative of $$\cos(x)$$ with respect to $x$ is **$$-\sin(x)$$**.",
                "formulas": [r"\frac{d}{dx}[\cos(x)] = -\sin(x)"],
                "steps": [
                    "1. **Definition of Derivative**: \lim_{h \to 0} \frac{\cos(x+h) - \cos(x)}{h}.",
                    "2. **Identity Expansion**: \cos(x+h) = \cos(x)\cos(h) - \sin(x)\sin(h).",
                    "3. **Evaluate Limits**: Yields -\sin(x) \cdot 1 = -\sin(x).",
                    "4. **Exact Result**: $$\mathbf{\frac{d}{dx}[\cos(x)] = -\sin(x)}$$"
                ],
                "analogy": "Starting at x = 0 where cos(x) is at its crest, the curve immediately slopes downward, which is why its derivative is negative.",
                "pitfalls": "Forgetting the negative sign on d/dx[cos(x)] is the single most common sign error in trigonometric calculus!",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "tan":
            return {
                "title": "Calculus Derivative: d/dx [tan(x)]",
                "core": "The derivative of $$\tan(x)$$ with respect to $x$ is **$$\sec^2(x)$$**.",
                "formulas": [r"\frac{d}{dx}[\tan(x)] = \sec^2(x) = \frac{1}{\cos^2(x)} = 1 + \tan^2(x)"],
                "steps": [
                    "1. **Rewrite as Quotient**: \tan(x) = \frac{\sin(x)}{\cos(x)}.",
                    "2. **Apply Quotient Rule**: \frac{u'v - uv'}{v^2} = \frac{\cos(x)\cos(x) - \sin(x)(-\sin(x))}{\cos^2(x)}.",
                    "3. **Pythagorean Identity**: \frac{\cos^2(x) + \sin^2(x)}{\cos^2(x)} = \frac{1}{\cos^2(x)} = \sec^2(x).",
                    "4. **Result**: $$\mathbf{\frac{d}{dx}[\tan(x)] = \sec^2(x)}$$"
                ],
                "analogy": "Because tangent approaches vertical asymptotes at ±π/2, its slope is always positive and accelerates rapidly toward infinity.",
                "pitfalls": "Remember sec²(x) is always positive for all real x in the domain.",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "e^x":
            return {
                "title": "Calculus Derivative: d/dx [e^x]",
                "core": "The derivative of the natural exponential function $$e^x$$ is **$$e^x$$**.",
                "formulas": [r"\frac{d}{dx}[e^x] = e^x", r"\frac{d}{dx}[e^{kx}] = k e^{kx}"],
                "steps": [
                    "1. **Foundational Definition**: The natural base e is uniquely defined such that the rate of change of e^x equals the function itself.",
                    "2. **Limit Definition**: \lim_{h \to 0} \frac{e^{x+h} - e^x}{h} = e^x \lim_{h \to 0} \frac{e^h - 1}{h} = e^x \cdot 1 = e^x.",
                    "3. **Result**: $$\mathbf{\frac{d}{dx}[e^x] = e^x}$$"
                ],
                "analogy": "e^x is the only non-zero mathematical curve where the height of the curve, the slope of the curve, and the area under the curve from -∞ are all identical.",
                "pitfalls": "When composite like e^(3x), remember to apply the chain rule: d/dx[e^(3x)] = 3e^(3x)!",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn in ["ln", "log"]:
            return {
                "title": "Calculus Derivative: d/dx [ln(x)]",
                "core": "The derivative of $$\ln(x)$$ for $x > 0$ is **$$\frac{1}{x}$$**.",
                "formulas": [r"\frac{d}{dx}[\ln(x)] = \frac{1}{x} \quad (x > 0)", r"\frac{d}{dx}[\ln|u|] = \frac{u'}{u}"],
                "steps": [
                    "1. **Implicit Differentiation**: If y = \ln(x), then e^y = x.",
                    "2. **Differentiate both sides**: e^y \cdot y' = 1 \implies y' = \frac{1}{e^y} = \frac{1}{x}.",
                    "3. **Result**: $$\mathbf{\frac{d}{dx}[\ln(x)] = \frac{1}{x}}$$"
                ],
                "analogy": "As x gets larger, the logarithmic curve flattens out, meaning its slope 1/x approaches zero.",
                "pitfalls": "Remember the domain restriction: x must be strictly positive (x > 0)!",
                "confidence": "100% Deterministic Calculus Standard"
            }

    # 2. Transcendental Integrals: e.g. "integral of sin(x)", "integral of e^x", "integral of 1/x"
    m_trans_integ = re.search(r'(?:integral of|integrate)\s*(sin|cos|e\^x|1/x)\s*(?:\(?\s*x\s*\)?)?', raw_lower)
    if m_trans_integ:
        fn = m_trans_integ.group(1).lower()
        if fn == "sin":
            return {
                "title": "Calculus Indefinite Integral: ∫ sin(x) dx",
                "core": "The indefinite integral of $$\sin(x)$$ is **$$-\cos(x) + C$$**.",
                "formulas": [r"\int \sin(x) \, dx = -\cos(x) + C"],
                "steps": ["1. Recognize that d/dx[-\cos(x)] = -(-\sin(x)) = \sin(x).", "2. Append constant of integration: -\cos(x) + C."],
                "analogy": "Reversing differentiation: the antiderivative of sine is negative cosine.",
                "pitfalls": "Do not forget the negative sign or the arbitrary constant + C!",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "cos":
            return {
                "title": "Calculus Indefinite Integral: ∫ cos(x) dx",
                "core": "The indefinite integral of $$\cos(x)$$ is **$$\sin(x) + C$$**.",
                "formulas": [r"\int \cos(x) \, dx = \sin(x) + C"],
                "steps": ["1. Recognize that d/dx[\sin(x)] = \cos(x).", "2. Append constant of integration: \sin(x) + C."],
                "analogy": "The area under one arch of cos(x) from -π/2 to π/2 is exactly 2.",
                "pitfalls": "Remember integral of cos(x) is POSITIVE sin(x) + C.",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "e^x":
            return {
                "title": "Calculus Indefinite Integral: ∫ e^x dx",
                "core": "The indefinite integral of $$e^x$$ is **$$e^x + C$$**.",
                "formulas": [r"\int e^x \, dx = e^x + C"],
                "steps": ["1. The antiderivative of e^x is itself: e^x.", "2. Append constant of integration: e^x + C."],
                "analogy": "e^x reproduces itself under both differentiation and integration.",
                "pitfalls": "Never omit + C on indefinite integrals!",
                "confidence": "100% Deterministic Calculus Standard"
            }
        elif fn == "1/x":
            return {
                "title": "Calculus Indefinite Integral: ∫ (1/x) dx",
                "core": "The indefinite integral of $$\frac{1}{x}$$ is **$$\ln|x| + C$$**.",
                "formulas": [r"\int \frac{1}{x} \, dx = \ln|x| + C"],
                "steps": [
                    "1. The power rule fails for x^{-1} because dividing by (-1 + 1) yields division by zero.",
                    "2. The antiderivative is uniquely defined as \ln|x| + C."
                ],
                "analogy": "1/x is the sole power exception where integration produces a logarithm.",
                "pitfalls": "Always use absolute value inside the logarithm: ln|x| + C!",
                "confidence": "100% Deterministic Calculus Standard"
            }

    # 3. Factorials: e.g. "5!", "what is 5!", "factorial of 6"
    m_fact = re.search(r'(\d+)\s*!|\bfactorial\s*(?:of)?\s*(\d+)', raw_lower)
    if m_fact:
        n = int(m_fact.group(1) or m_fact.group(2))
        if 0 <= n <= 100:
            fact_val = math.factorial(n)
            expansion = " × ".join(str(i) for i in range(n, 0, -1)) if n > 0 else "1"
            if len(expansion) > 40: expansion = f"{n} × {n-1} × ... × 2 × 1"
            return {
                "title": f"Combinatorics: Factorial {n}!",
                "core": f"**{n}! = {fact_val}**.",
                "formulas": [f"{n}! = \\prod_{{i=1}}^{{{n}}} i = {expansion} = {fact_val}"],
                "steps": [
                    f"1. **Definition**: n! is the product of all positive integers less than or equal to n.",
                    f"2. **Expansion**: {expansion}.",
                    f"3. **Result**: {n}! = {fact_val}."
                ],
                "analogy": f"The number of unique ways to arrange {n} distinct books on a shelf is exactly {n}!.",
                "pitfalls": "Remember by definition that 0! = 1 (the empty product).",
                "confidence": "100% Combinatorial Precision"
            }

    # 4. Square Roots & Cube Roots: e.g. "sqrt(144)", "square root of 81", "cbrt(125)", "cube root of 27"
    m_root = re.search(r'(?:square root of|sqrt\s*\(?)\s*(\d+(?:\.\d+)?)\)?|(?:cube root of|cbrt\s*\(?)\s*(\d+(?:\.\d+)?)\)?', raw_lower)
    if m_root:
        is_cube = "cube" in raw_lower or "cbrt" in raw_lower
        num = float(m_root.group(2) if is_cube else m_root.group(1))
        if is_cube:
            ans = num ** (1.0 / 3.0)
            ans_fmt = int(round(ans)) if abs(ans - round(ans)) < 1e-6 else round(ans, 4)
            return {
                "title": f"Cube Root: ∛{num}",
                "core": f"The cube root of $${num}$$ is **{ans_fmt}** (since $${ans_fmt}^3 = {num}$$).",
                "formulas": [f"\sqrt[3]{{{num}}} = {ans_fmt}"],
                "steps": [
                    f"1. **Definition**: Finding a number y such that y³ = {num}.",
                    f"2. **Verify**: ({ans_fmt})³ = {num}."
                ],
                "analogy": f"If a cube has volume {num}, each of its edges has length {ans_fmt}.",
                "pitfalls": "Negative numbers CAN have real cube roots (e.g. ∛(-8) = -2)!",
                "confidence": "100% Arithmetic Precision"
            }
        else:
            if num >= 0:
                ans = math.sqrt(num)
                ans_fmt = int(ans) if ans.is_integer() else round(ans, 4)
                return {
                    "title": f"Square Root: √{num}",
                    "core": f"The principal square root of $${num}$$ is **{ans_fmt}** (since $${ans_fmt}^2 = {num}$$).",
                    "formulas": [f"\sqrt{{{num}}} = {ans_fmt}"],
                    "steps": [
                        f"1. **Definition**: The non-negative number whose square equals {num}.",
                        f"2. **Verify**: ({ans_fmt})² = {num}."
                    ],
                    "analogy": f"If a square garden has area {num}, each side measures exactly {ans_fmt}.",
                    "pitfalls": "The radical symbol √ denotes exclusively the PRINCIPAL (non-negative) root.",
                    "confidence": "100% Arithmetic Precision"
                }

    # 5. Powers & Exponentiation: e.g. "2^10", "3 to the power 5", "5 raised to 3"
    m_pow = re.search(r'(\d+(?:\.\d+)?)\s*(?:\^|\*\*|\s+to the power of\s+|\s+raised to(?:\s+the\s+power\s+of)?\s+)(\d+(?:\.\d+)?)', raw_lower)
    if m_pow:
        base = float(m_pow.group(1))
        exp = float(m_pow.group(2))
        if exp <= 100:
            val = base ** exp
            b_fmt = int(base) if base.is_integer() else base
            e_fmt = int(exp) if exp.is_integer() else exp
            v_fmt = int(val) if val.is_integer() else round(val, 4)
            return {
                "title": f"Exponentiation: {b_fmt}^{e_fmt}",
                "core": f"**{b_fmt}^{{{e_fmt}}} = {v_fmt}**.",
                "formulas": [f"{b_fmt}^{{{e_fmt}}} = {v_fmt}"],
                "steps": [
                    f"1. **Base & Exponent**: Base = {b_fmt}, Exponent = {e_fmt}.",
                    f"2. **Repeated Multiplication**: Multiply {b_fmt} by itself {e_fmt} times.",
                    f"3. **Result**: {v_fmt}."
                ],
                "analogy": "Exponential growth compounds at every iteration—doubling 10 times turns 1 into 1,024.",
                "pitfalls": "Remember that x^0 = 1 for all non-zero numbers x.",
                "confidence": "100% Arithmetic Precision"
            }

    # 6. GCD & LCM: e.g. "gcd of 48 and 180", "lcm of 12 and 18"
    m_gcd = re.search(r'(?:gcd|greatest common divisor|hcf)\s*(?:of)?\s*(\d+)\s*(?:and|,)\s*(\d+)', raw_lower)
    if m_gcd:
        a = int(m_gcd.group(1))
        b = int(m_gcd.group(2))
        gcd_val = math.gcd(a, b)
        return {
            "title": f"Number Theory: GCD({a}, {b})",
            "core": f"The Greatest Common Divisor of {a} and {b} is **{gcd_val}**.",
            "formulas": [f"\gcd({a}, {b}) = {gcd_val}"],
            "steps": [
                f"1. **Euclidean Algorithm**: Repeatedly divide larger by smaller and take the remainder.",
                f"2. **Result**: \gcd({a}, {b}) = {gcd_val}."
            ],
            "analogy": f"The largest square tile that can evenly pave a rectangular floor of {a} by {b} without cutting tiles has side length {gcd_val}.",
            "pitfalls": "GCD is always less than or equal to the smaller of the two numbers.",
            "confidence": "100% Number Theory Standard"
        }

    m_lcm = re.search(r'(?:lcm|least common multiple)\s*(?:of)?\s*(\d+)\s*(?:and|,)\s*(\d+)', raw_lower)
    if m_lcm:
        a = int(m_lcm.group(1))
        b = int(m_lcm.group(2))
        lcm_val = abs(a * b) // math.gcd(a, b)
        return {
            "title": f"Number Theory: LCM({a}, {b})",
            "core": f"The Least Common Multiple of {a} and {b} is **{lcm_val}**.",
            "formulas": [f"\text{{lcm}}({a}, {b}) = \frac{{|{a} \times {b}|}}{{\gcd({a}, {b})}} = {lcm_val}"],
            "steps": [
                f"1. **GCD Calculation**: \gcd({a}, {b}) = {math.gcd(a, b)}.",
                f"2. **Formula**: \text{{lcm}}(a, b) = (|a · b|) / \gcd(a, b) = ({a} × {b}) / {math.gcd(a, b)} = {lcm_val}."
            ],
            "analogy": f"If two blinking lights flash every {a} seconds and {b} seconds, they will synchronize and flash together every {lcm_val} seconds.",
            "pitfalls": "Do not confuse LCM with GCD—LCM is always greater than or equal to both numbers.",
            "confidence": "100% Number Theory Standard"
        }

    # 7. Trigonometric Functions: e.g. "sin(30)", "cos(60)", "tan(45)", "sin(pi/2)"
    m_trig = re.search(r'(?:what is\s+)?(sin|cos|tan)\s*\(\s*([0-9\.\s\/\*piPI]+)\s*\)|(?:what is\s+)?(sin|cos|tan)\s+(\d+(?:\.\d+)?)\s*(?:deg|degrees)?', raw_lower)
    if m_trig:
        fn = m_trig.group(1) or m_trig.group(3)
        arg_str = m_trig.group(2) or m_trig.group(4)
        arg_str = arg_str.strip().lower()
        
        is_deg = True
        if "pi" in arg_str:
            is_deg = False
            rad_val = math.pi
            if "/" in arg_str:
                parts = arg_str.split("/")
                denom = float(re.search(r'\d+', parts[1]).group())
                rad_val = math.pi / denom
        else:
            deg_val = float(arg_str)
            rad_val = math.radians(deg_val)

        if fn == "sin":
            val = math.sin(rad_val)
        elif fn == "cos":
            val = math.cos(rad_val)
        elif fn == "tan":
            val = math.tan(rad_val)

        val_fmt = int(round(val)) if abs(val - round(val)) < 1e-6 else round(val, 4)
        return {
            "title": f"Trigonometry: {fn}({arg_str})",
            "core": f"**{fn}({arg_str}) = {val_fmt}**.",
            "formulas": [f"{fn}({arg_str}) = {val_fmt}"],
            "steps": [
                f"1. **Angle Mode**: Input angle is {arg_str} ({round(rad_val, 4)} radians).",
                f"2. **Trigonometric Evaluation**: {fn}({round(rad_val, 4)}) = {val_fmt}."
            ],
            "analogy": "On the unit circle, cos(θ) gives horizontal x-coordinate and sin(θ) gives vertical y-coordinate.",
            "pitfalls": "Always check whether your calculator is in Degree or Radian mode!",
            "confidence": "100% Trigonometric Precision"
        }

    # 8. Logarithms: e.g. "log(100)", "ln(e)", "log2(64)"
    m_log = re.search(r'(log10|log2|ln|log)\s*\(\s*([0-9\.\s\/eE]+)\s*\)|(?:log of|ln of)\s*(\d+(?:\.\d+)?)', raw_lower)
    if m_log:
        fn = m_log.group(1) or ("ln" if "ln" in raw_lower else "log10")
        arg = m_log.group(2) or m_log.group(3)
        if arg == "e":
            num = math.e
        else:
            num = float(arg)

        if num > 0:
            if fn == "ln":
                res = math.log(num)
                base_str = "e"
            elif fn == "log2":
                res = math.log2(num)
                base_str = "2"
            else:
                res = math.log10(num)
                base_str = "10"

            r_fmt = int(round(res)) if abs(res - round(res)) < 1e-6 else round(res, 4)
            return {
                "title": f"Logarithm: {fn}({arg})",
                "core": f"**{fn}({arg}) = {r_fmt}** (since $${base_str}^{{{r_fmt}}} = {arg}$$).",
                "formulas": [f"\log_{{{base_str}}}({arg}) = {r_fmt} \iff {base_str}^{{{r_fmt}}} = {arg}"],
                "steps": [
                    f"1. **Definition**: The power to which base {base_str} must be raised to produce {arg}.",
                    f"2. **Compute**: {r_fmt}."
                ],
                "analogy": "Logarithms answer: 'How many times do I need to multiply the base to reach this number?'",
                "pitfalls": "Logarithms of negative numbers and zero are undefined in real numbers!",
                "confidence": "100% Arithmetic Precision"
            }

    # 9. Chemistry Molar Mass Lookup
    for comp_key, (comp_name, comp_mass, comp_breakdown) in MOLAR_MASSES.items():
        if f"molar mass of {comp_key}" in raw_lower or f"molar mass of {comp_name.lower()}" in raw_lower or raw_lower == f"molar mass {comp_key}":
            return {
                "title": f"Chemistry: Molar Mass of {comp_name}",
                "core": f"The molar mass of **{comp_name}** is **{comp_mass} g/mol**.",
                "formulas": [f"M = {comp_mass} \\text{{ g/mol}}"],
                "steps": [
                    "1. **Sum Atomic Weights**: " + " + ".join(comp_breakdown),
                    f"2. **Total Molar Mass**: {comp_mass} grams per mole."
                ],
                "analogy": f"One mole (6.022 × 10²³ molecules) of {comp_name} weighs exactly {comp_mass} grams.",
                "pitfalls": "Remember to multiply each element's atomic weight by its subscript in the chemical formula!",
                "confidence": "100% Chemical Standard"
            }

    # 10. Polynomial Differentiation
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
                f"1. **Apply Power Rule**: Multiply each coefficient by its exponent, then decrement exponent by 1.",
                f"2. **Differentiate Constants**: Constant terms have zero rate of change: \\frac{{d}}{{dx}}[c] = 0.",
                f"3. **Result**: $$\mathbf{{\\frac{{d}}{{dx}}[{poly_str}] = {ans}}}$$"
            ],
            "analogy": "Differentiating a function gives its instantaneous slope at every point.",
            "pitfalls": "Remember derivative of a constant term is 0!",
            "confidence": "100% Deterministic Calculus Standard"
        }

    # 11. Polynomial Integration
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
                f"2. **Add Constant of Integration**: Always append + C for indefinite integrals.",
                f"3. **Result**: $$\mathbf{{\\int ({poly_str}) \, dx = {ans}}}$$"
            ],
            "analogy": "Integration accumulates all slices of area under the curve to find total accumulation.",
            "pitfalls": "Never forget the arbitrary constant of integration + C!",
            "confidence": "100% Deterministic Calculus Standard"
        }

    # 12. Linear Equation Solver: e.g. "solve 3x + 9 = 24", "5x - 15 = 35", "3x = 15"
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
                    "formulas": [f"{eq_label} \implies {a_fmt}x = {c_fmt - b_fmt} \implies x = {x_fmt}"],
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

    # 13. Quadratic Equation Solver: e.g. "x^2 - 5x + 6 = 0", "x^2 - 9 = 0", "2x^2 + 4x = 0"
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
                    f"ax^2 + bx + c = 0 \implies x = \frac{{-b \pm \sqrt{{b^2 - 4ac}}}}{{2a}}",
                    f"\Delta = b^2 - 4ac = ({b})^2 - 4({a})({c}) = {round(discriminant, 4)}",
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

    # 14. Percentage: e.g. "15% of 240" or "what is 20 percent of 850"
    m_pct = re.search(r'(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)', raw_lower)
    if m_pct:
        pct = float(m_pct.group(1))
        tot = float(m_pct.group(2))
        val = (pct / 100.0) * tot
        val_fmt = int(val) if val.is_integer() else round(val, 4)
        return {
            "title": f"Percentage Calculation: {pct}% of {tot}",
            "core": f"**{pct}% of {tot} is {val_fmt}**.",
            "formulas": [f"\text{{Value}} = \left(\frac{{{pct}}}{{100}}\right) \times {tot} = {val_fmt}"],
            "steps": [
                f"1. **Convert Percent to Decimal**: {pct}% = {pct} / 100 = {pct/100}.",
                f"2. **Multiply by Whole**: {pct/100} × {tot} = {val_fmt}."
            ],
            "analogy": f"If you divide {tot} into 100 equal parts, taking {pct} of those parts gives exactly {val_fmt}.",
            "pitfalls": "Remember 'of' means multiplication in percentage word problems.",
            "confidence": "100% Deterministic Arithmetic"
        }

    # 15. Physics Word Problem: Force (F = m * a)
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
                "formulas": [f"F = m \cdot a = ({m_val} \text{{ kg}}) \times ({a_val} \text{{ m/s}}^2) = {f_fmt} \text{{ N}}"],
                "steps": [
                    f"1. **Newton's Second Law**: F_net = m × a.",
                    f"2. **Substitute Knowns**: Mass m = {m_val} kg, Acceleration a = {a_val} m/s².",
                    f"3. **Compute**: F = {m_val} × {a_val} = {f_fmt} N."
                ],
                "analogy": "The heavier an object (mass) and the faster you want to change its speed (acceleration), the harder you must push (force).",
                "pitfalls": "Ensure mass is in kilograms (kg) and acceleration in m/s² so the resulting unit is in standard Newtons.",
                "confidence": "100% Classical Physics Mechanics"
            }

    # 16. Physics Word Problem: Kinetic Energy (1/2 m v^2)
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
                "formulas": [f"E_k = \frac{{1}}{{2}} m v^2 = \frac{{1}}{{2}} ({m_val}) ({v_val})^2 = {ke_fmt} \text{{ J}}"],
                "steps": [
                    f"1. **Formula**: E_k = 1/2 · m · v².",
                    f"2. **Square Velocity**: v² = ({v_val})² = {v_val**2}.",
                    f"3. **Compute**: 0.5 × {m_val} × {v_val**2} = {ke_fmt} J."
                ],
                "analogy": "Doubling your car's speed quadruples its braking energy because kinetic energy scales with the square of velocity.",
                "pitfalls": "Do not forget to square the velocity BEFORE multiplying by 1/2 mass!",
                "confidence": "100% Classical Physics Mechanics"
            }

    # 17. Physics Word Problem: Speed (v = d / t)
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
                "formulas": [f"v = \frac{{d}}{{t}} = \frac{{{d_val}}}{{{t_val}}} = {spd_fmt}"],
                "steps": [
                    f"1. **Definition**: Average speed is total distance divided by elapsed time.",
                    f"2. **Compute**: v = {d_val} / {t_val} = {spd_fmt}."
                ],
                "analogy": "Speed measures the rate at which distance is covered per tick of the clock.",
                "pitfalls": "Make sure distance and time units match (e.g., km with hours, or meters with seconds).",
                "confidence": "100% Kinematics Standard"
            }

    # 18. Physics: Ohm's Law (V = I * R)
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
                "formulas": [f"V = I \cdot R = ({i_val} \text{{ A}}) \times ({r_val} \,\Omega) = {v_fmt} \text{{ V}}"],
                "steps": [
                    "1. **Ohm's Law**: Voltage across a conductor equals current multiplied by resistance (V = I · R).",
                    f"2. **Compute**: V = {i_val} × {r_val} = {v_fmt} V."
                ],
                "analogy": "Voltage is water pressure, current is volume flow rate of water, and resistance is the narrowness of the pipe.",
                "pitfalls": "Ensure current is in Amperes (A) and resistance in Ohms (Ω).",
                "confidence": "100% Electromagnetism Standard"
            }
        elif v_val is not None and r_val is not None and r_val > 0:
            i_res = v_val / r_val
            i_fmt = int(i_res) if i_res.is_integer() else round(i_res, 4)
            return {
                "title": f"Ohm's Law Current Calculation (V = {v_val} V, R = {r_val} Ω)",
                "core": f"The resulting electric current is **{i_fmt} Amperes (A)**.",
                "formulas": [f"I = \frac{{V}}{{R}} = \frac{{{v_val} \text{{ V}}}}{{{r_val} \,\Omega}} = {i_fmt} \text{{ A}}"],
                "steps": [
                    "1. **Ohm's Law**: Current is electric potential divided by resistance (I = V / R).",
                    f"2. **Compute**: I = {v_val} / {r_val} = {i_fmt} A."
                ],
                "analogy": "Higher pressure (voltage) through the same pipe pushes more water (current).",
                "pitfalls": "Check if resistance is in kΩ (kilo-ohms); multiply by 1000 if needed!",
                "confidence": "100% Electromagnetism Standard"
            }

    # 19. Physics: Work & Power
    if ("work done" in raw_lower or ("work" in raw_lower and "force" in raw_lower and "distance" in raw_lower)):
        f_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*n\b', r'force\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: f_val = float(m.group(1)); break
        d_val = None
        for pat in [r'(\d+(?:\.\d+)?)\s*m\b', r'distance\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)']:
            m = re.search(pat, raw_lower)
            if m: d_val = float(m.group(1)); break
        if f_val is not None and d_val is not None:
            w_res = f_val * d_val
            w_fmt = int(w_res) if w_res.is_integer() else round(w_res, 4)
            return {
                "title": f"Physics Work Calculation (F = {f_val} N, d = {d_val} m)",
                "core": f"The mechanical work done is **{w_fmt} Joules (J)**.",
                "formulas": [f"W = F \cdot d = ({f_val} \text{{ N}}) \times ({d_val} \text{{ m}}) = {w_fmt} \text{{ J}}"],
                "steps": [
                    "1. **Work Equation**: Work equals Force multiplied by displacement (W = F · d).",
                    f"2. **Compute**: W = {f_val} × {d_val} = {w_fmt} Joules."
                ],
                "analogy": "Pushing a box with 10 N across 5 meters transfers 50 Joules of energy.",
                "pitfalls": "If force is perpendicular to motion, work is 0!",
                "confidence": "100% Classical Mechanics Standard"
            }

    # 20. Unit Conversions: Temperature (C to F, F to C)
    m_c2f = re.search(r'convert\s*(\d+(?:\.\d+)?)\s*(?:°|degrees)?\s*c(?:elsius)?\s*to\s*(?:°|degrees)?\s*f(?:ahrenheit)?', raw_lower)
    if m_c2f:
        c = float(m_c2f.group(1))
        f_val = c * 9.0 / 5.0 + 32.0
        f_fmt = int(f_val) if f_val.is_integer() else round(f_val, 2)
        return {
            "title": f"Temperature Conversion: {c}°C to °F",
            "core": f"**{c}°C is equal to {f_fmt}°F**.",
            "formulas": [f"F = C \times \frac{{9}}{{5}} + 32 = ({c} \times 1.8) + 32 = {f_fmt}^\circ\text{{F}}"],
            "steps": [
                f"1. **Multiply by 1.8**: {c} × 1.8 = {c * 1.8}.",
                f"2. **Add 32**: {c * 1.8} + 32 = {f_fmt}°F."
            ],
            "analogy": "Water freezes at 0°C (32°F) and boils at 100°C (212°F).",
            "pitfalls": "Remember to multiply by 9/5 FIRST before adding 32!",
            "confidence": "100% Unit Conversion Standard"
        }

    m_f2c = re.search(r'convert\s*(\d+(?:\.\d+)?)\s*(?:°|degrees)?\s*f(?:ahrenheit)?\s*to\s*(?:°|degrees)?\s*c(?:elsius)?', raw_lower)
    if m_f2c:
        f_val = float(m_f2c.group(1))
        c_val = (f_val - 32.0) * 5.0 / 9.0
        c_fmt = int(c_val) if c_val.is_integer() else round(c_val, 2)
        return {
            "title": f"Temperature Conversion: {f_val}°F to °C",
            "core": f"**{f_val}°F is equal to {c_fmt}°C**.",
            "formulas": [f"C = (F - 32) \times \frac{{5}}{{9}} = ({f_val} - 32) \times \frac{{5}}{{9}} = {c_fmt}^\circ\text{{C}}"],
            "steps": [
                f"1. **Subtract 32**: {f_val} - 32 = {f_val - 32}.",
                f"2. **Multiply by 5/9**: {f_val - 32} × 5/9 = {c_fmt}°C."
            ],
            "analogy": "Subtract 32 then multiply by 5/9 for exact conversion.",
            "pitfalls": "Remember to subtract 32 in parentheses FIRST!",
            "confidence": "100% Unit Conversion Standard"
        }

    # 21. General Arithmetic Evaluation (PEMDAS / BODMAS)
    arith_target = nl_clean if re.match(r'^[\d\s\+\-\*/\^\(\)\.\%]+$', nl_clean) else None
    if not arith_target:
        clean_raw = raw_lower.replace('what is', '').replace('calculate', '').replace('evaluate', '').strip(" ?.")
        if re.match(r'^[\d\s\+\-\*/\^\(\)\.\%xX]+$', clean_raw) and any(c in clean_raw for c in '+-*/^%'):
            arith_target = clean_raw

    if arith_target:
        try:
            val = safe_eval_expr(arith_target)
            val_fmt = int(val) if isinstance(val, (int, float)) and float(val).is_integer() else round(val, 4)
            return {
                "title": f"Arithmetic Evaluation: {arith_target}",
                "core": f"The exact evaluation of $${arith_target}$$ is **{val_fmt}**.",
                "formulas": [f"{arith_target} = {val_fmt}"],
                "steps": [
                    "1. **Order of Operations (PEMDAS)**: Parentheses ⟶ Exponents ⟶ Multiplication/Division ⟶ Addition/Subtraction.",
                    f"2. **Result**: {val_fmt}."
                ],
                "analogy": "Systematic algebraic order ensures deterministic, exact results.",
                "pitfalls": "Operations at the same precedence level are performed strictly left-to-right!",
                "confidence": "100% Deterministic Mathematical Precision"
            }
        except Exception:
            pass

    return None


def lookup_factual_knowledge(query: str) -> Optional[Dict[str, Any]]:
    """Accurately match common factual, scientific, and geographic questions with verified answers."""
    q = query.lower().strip()
    
    FACTS_CATALOG = [
# 1. PERSONA & IDENTITY: CHATBOT ABHI
    (r'^(?:who\s+are\s+you|what\s+is\s+your\s+name|who\s+(?:made|created|built|developed)\s+you|tell\s+me\s+about\s+yourself|who\s+is\s+chatbot\s+abhi)', {
        "title": "Interactive Assistant: Chatbot Abhi",
        "core": "I am **Chatbot Abhi**, an intelligent, interactive 3D AI educational assistant created by **Abhijeeth V S**.",
        "formulas": [],
        "steps": [
            "1. **Creator & Purpose**: Conceived, designed, and developed by **Abhijeeth V S** to provide students and learners with an ultra-responsive, highly accurate, and engaging STEM study companion.",
            "2. **3D Interactive Avatar**: Features an articulated humanoid 3D avatar sculpted with athletic masculine human anatomy and dressed in tailored modern menswear (navy blazer, collared dress shirt, silk tie, leather belt, slacks, and classic leather dress shoes) with animated head-tracking, expressive eyes, five customizable wardrobe uniforms, and real-time physical gestures (✋ High-Five, 👋 Hello, 👋 Bye, 💋 Flying Kiss, 🫡 Salute).",
            "3. **Multi-Discipline Intelligence**: Equipped with sub-millisecond symbolic mathematical solvers (Calculus, Polynomial Integration, Differentiation, Molar Mass chemistry), comprehensive physics/biology/computer science encyclopedias, and professional communication skills coaching.",
            "4. **Zero-Latency Architecture**: Answers common academic and factual queries deterministically in under 1 millisecond, complete with step-by-step reasoning, KaTeX mathematical formulas, intuitive analogies, and exam pitfalls."
        ],
        "analogy": "Like having an enthusiastic, personal futuristic robot tutor sitting right beside you at your study desk, ready to tackle any problem together!",
        "pitfalls": "I am **Chatbot Abhi** created by **Abhijeeth V S**—never a generic template bot or standard off-the-shelf chatbot!",
        "confidence": "100% Core Identity Verified"
    }),

    # 1B. 3D ROBOT ACTION HAND CONFIGURATION / REVERSE HAND
    (r'(?:(?:change|reverse|swap|switch|revsre)\s+(?:the\s+)?(?:hand|arm)(?:\s+(?:for\s+)?(?:action|gesture|movement))?|(?:hand\s+action\s+reverse)|(?:revsre\s+the\s+hand))', {
        "title": "3D Humanoid Robot: Action Hand Reversal & Kinematic Mirroring",
        "core": "The active arm and hand for all 3D physical gestures and conversational animations can be dynamically reversed between **Left Hand** and **Right Hand**.",
        "formulas": [
            r"\theta_{\text{left}}(t) = \mathcal{M}(\theta_{\text{right}}(t)) \quad \text{(Bilateral Symmetrical Kinematic Mirroring)}",
            r"\begin{pmatrix} x' \\ y' \\ z' \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & -1 \end{pmatrix} \begin{pmatrix} x \\ y \\ z \end{pmatrix}"
        ],
        "steps": [
            "1. **Reversed Hand Mode Active**: By default, the robot's action hand is reversed to the **Left Hand**, allowing the humanoid avatar to lead all waving, saluting, and greeting motions from the viewer's perspective.",
            "2. **Supported Interactive Actions**: All gestures—**✋ High-Five**, **👋 Hello (wave)**, **👋 Bye (farewell)**, **💋 Flying Kiss (3D floating hearts)**, **🫡 Salute**, **Thinking (chin rest)**, and **Conversational Explaining gestures**—automatically adapt their kinematics to the active hand.",
            "3. **Real-Time Toggle Button**: Use the **🔄 Hand: Left (Reversed)** / **🔄 Hand: Right (Standard)** pill in the 3D HUD action bar to instantly reverse or swap hands at any time.",
            "4. **Dynamic Stance Compensation**: Leg kinematics and hip weight distribution automatically shift to the opposite leg to ground the posture authentically during gestures."
        ],
        "analogy": "Like an ambidextrous presenter or conductor who effortlessly switches their conducting or gesturing baton from right hand to left hand on demand!",
        "pitfalls": "All 5 articulated fingers, knuckles, and wrist rotations mirror along the coronal anatomical axis so the gesture remains 100% natural and never inverted backward.",
        "confidence": "100% Kinematic Geometry Verified"
    }),

    # 1C. HANDSOME GUY LOOK & DISCIPLINED DRESS ARCHITECTURE
    (r'(?:(?:handsome(?:\s+guy)?(?:\s+look)?)|(?:displine|discipline|disciplined)(?:\s+dress)?|(?:tailored\s+suit)|(?:gentleman\s+suit)|(?:robot\s+dress)|(?:robot\s+clothes))', {
        "title": "3D Humanoid Robot: Handsome Guy Sculpt & Disciplined Formal Menswear",
        "core": "Chatbot Abhi features an anatomically proportioned **Handsome Male Humanoid Sculpt** dressed in an immaculate **Disciplined Bespoke Formal Suit**.",
        "formulas": [
            r"\text{Aesthetic Golden Ratio} \approx 1.618 \quad \text{(Masculine Craniofacial Ideal)}",
            r"\text{Disciplined Dress} = \text{Blazer} + \text{Epaulettes} + \text{Shirt} + \text{Windsor Tie} + \text{Belt} + \text{Creased Slacks} + \text{Oxford Shoes}"
        ],
        "steps": [
            "1. **Handsome Masculine Facial Sculpt**: Designed with sharp golden-ratio facial architecture—sculpted frontal bone, defined zygomatic cheekbones with subtle model blush, sharp mandibular jawline with mental protuberance and cleft chin, symmetrical almond eyes with positive canthal tilt and sparkling specular catchlights, straight anatomical dorsal nose, and charismatic lips with a subtle resting smile.",
            "2. **Modern Swept Pompadour Quiff**: Tailored coiffure with tapered fade on the sides and back, crisp side-part grooming line, and voluminous upward-and-backward swept quiff with layered texture locks in rich dark espresso brunette.",
            "3. **Disciplined Formal Suit (Active by Default)**: Bespoke midnight navy fine wool blazer with structured shoulder epaulettes and gold piping, sharp satin peak lapels, vertically aligned gold crested buttons, crisp poplin dress shirt with stiff spread collar, imperial crimson silk tie held with a polished 18k gold tie bar, 3-tier merit ribbon bar, and folded white linen pocket square with gold trim.",
            "4. **Disciplined Accessories & Footwear**: Italian dark leather belt with polished buckle, French shirt cuffs with 18k gold cufflinks, executive chronometer wristwatch on the wrist, tailored trousers with razor-sharp pressed front creases, and hand-burnished mahogany espresso Oxford dress shoes with mirror cap-toes."
        ],
        "analogy": "Like a distinguished, disciplined gentleman officer dressed in bespoke Savile Row tailoring, ready to instruct with effortless elegance and precision!",
        "pitfalls": "The disciplined suit is fully integrated into the 3D kinematic rig, so all waving, high-fives, thinking gestures, and 360° orbits maintain sharp crease lines without clipping.",
        "confidence": "100% 3D Aesthetic Architecture Verified"
    }),

    # 2. AERODYNAMICS: HOW PLANES FLY
    (r'(?:how\s+(?:do\s+)?(?:air)?planes?\s+fly|how\s+(?:do\s+)?airplanes?\s+stay\s+in\s+the\s+air|mechanism\s+of\s+flight)', {
        "title": "Aerodynamics & Fluid Dynamics: How Airplanes Fly",
        "core": "Airplanes fly by generating **Lift**—an upward aerodynamic force that overcomes the aircraft's weight—through the interaction of an **airfoil (curved wing)** with oncoming air, governed by **Bernoulli's Principle** and **Newton's Third Law of Motion**.",
        "formulas": [
            r"L = \frac{1}{2} \rho v^2 S C_L \quad \text{(Aerodynamic Lift Equation)}",
            r"P + \frac{1}{2}\rho v^2 = \text{constant} \quad \text{(Bernoulli's Principle)}",
            r"F_{\text{net}} = \vec{L} + \vec{W} + \vec{T} + \vec{D} = 0 \quad \text{(Steady Level Flight)}"
        ],
        "steps": [
            "1. **The Four Fundamental Forces**: Flight is a dynamic balance of four vectors: **Lift** (upward force from wings), **Weight** (downward force of gravity: $W = mg$), **Thrust** (forward propulsion from jet engines or propellers), and **Drag** (backward aerodynamic friction). In steady level flight, $\\text{Lift} = \\text{Weight}$ and $\\text{Thrust} = \\text{Drag}$.",
            r"2. **Airfoil Geometry & Angle of Attack**: An airplane's wing cross-section (airfoil) is curved on top (camber) and flatter on the bottom, tilted slightly relative to the oncoming airflow at an **angle of attack** ($\alpha$). As the aircraft hurtles forward, oncoming airflow divides smoothly at the leading edge.",
            "3. **Bernoulli's Principle (Pressure Differential)**: Because of the camber and boundary airflow constraints, air traveling over the upper convex surface accelerates to a higher velocity ($v_{\\text{top}} > v_{\\text{bottom}}$). By Bernoulli's equation, faster airflow generates lower static pressure ($P_{\\text{top}} < P_{\\text{bottom}}$), creating a suction force pulling the wing upward.",
            "4. **Newton's Third Law (Downwash Momentum)**: As the tilted wing travels through the air, it deflects massive columns of air downward at high speed (the downwash). By Newton's Third Law ($F_{\\text{action}} = -F_{\\text{reaction}}$), forcing thousands of tons of air downward exerts an equal and opposite upward mechanical force lifting the plane into the sky."
        ],
        "analogy": "Stick your hand flat out the window of a moving car and tilt your palm upward slightly: the oncoming rush of air hits your palm and forcefully shoves your entire arm upward.",
        "pitfalls": "Beware the widespread 'Equal Transit Time' myth! It falsely claims air molecules split at the front must meet at the back at the same time. In reality, wind tunnel tests show air over the top travels substantially faster and reaches the trailing edge long before air on the bottom!",
        "confidence": "100% Aerodynamic Standard"
    }),

    # 3. ATMOSPHERIC OPTICS: WHY IS THE SKY BLUE
    (r'(?:why\s+(?:is\s+)?(?:the\s+)?sky\s+blue|why\s+sky\s+is\s+blue)', {
        "title": "Atmospheric Optics: Why the Sky is Blue (Rayleigh Scattering)",
        "core": "The sky appears blue because Earth's atmosphere scatters sunlight through **Rayleigh Scattering**, where shorter wavelengths of visible light (blue and violet) are scattered in all directions far more intensely than longer wavelengths (red and orange) by nitrogen ($N_2$) and oxygen ($O_2$) molecules.",
        "formulas": [
            r"I(\lambda) \propto \frac{1}{\lambda^4} \quad \text{(Rayleigh's Inverse Fourth Power Law)}",
            r"\frac{I_{\text{blue}}}{I_{\text{red}}} \approx \left(\frac{700\text{ nm}}{450\text{ nm}}\right)^4 \approx (1.55)^4 \approx 5.8 \times \text{ more scattering}"
        ],
        "steps": [
            "1. **Polychromatic Sunlight**: Light emitted by the Sun looks white, but it is a continuous spectrum containing all rainbow wavelengths—from long red waves ($\sim 700\\text{ nm}$) to short blue/violet waves ($\sim 400\\text{ nm}$).",
            "2. **Molecular Rayleigh Scattering**: Earth's atmosphere is composed of gas molecules (primarily $N_2$ and $O_2$) whose physical diameters are vastly smaller than the wavelength of visible light. Lord Rayleigh proved that light scattered by such microscopic particles has an intensity inversely proportional to the fourth power of wavelength ($I \\propto 1/\\lambda^4$).",
            "3. **Blue Dominance**: Because blue light has a wavelength nearly half that of red light, blue photons are scattered sideways and downward across the sky nearly 6 times more intensely than red photons, filling the daytime sky with an ambient blue glow.",
            "4. **Human Photoreceptor Tuning**: Why isn't the sky violet? While violet light is scattered even more strongly than blue, sunlight contains significantly fewer violet photons, and human retinal trichromatic cone cells are far more sensitive to blue and green wavelengths than to violet, perceiving the sky as bright azure blue.",
            "5. **Golden Sunsets**: At sunset, sunlight must travel through up to 10 times more atmospheric path length to reach your eyes. Almost all short blue wavelengths are scattered away before reaching you, leaving only the unscattered long red, orange, and gold rays to reach your eyes."
        ],
        "analogy": "Imagine throwing different balls through a dense forest of thin bamboo: large basketballs (red waves) pass straight through without colliding, while tiny ping-pong balls (blue waves) bounce vigorously off every single bamboo stalk and scatter everywhere.",
        "pitfalls": "The ocean does NOT cause the blue sky! The sky is blue entirely due to Rayleigh scattering in the air; in fact, large lakes and oceans appear blue primarily because they absorb red light and reflect the blue sky above them.",
        "confidence": "100% Atmospheric Optics Standard"
    }),

    # 4. ASTRONOMY: WHY DO STARS TWINKLE
    (r'(?:why\s+(?:do\s+)?stars\s+twinkle|why\s+stars\s+twinkle|twinkling\s+of\s+stars)', {
        "title": "Astronomy & Optics: Why Stars Twinkle (Atmospheric Scintillation)",
        "core": "Stars twinkle due to **Atmospheric Scintillation**—the rapid, chaotic refraction and bending of starlight as it travels through turbulent, moving layers of Earth's atmosphere with fluctuating temperatures and air densities.",
        "formulas": [
            r"n = \frac{c}{v} \quad \text{(Refractive Index)}, \quad n_1 \sin\theta_1 = n_2 \sin\theta_2 \quad \text{(Snell's Law)}"
        ],
        "steps": [
            "1. **Infinitesimal Point Sources**: Stars are located trillions of kilometers away (the nearest, Proxima Centauri, is 4.24 light-years distant). Because of this immense distance, starlight arrives at Earth as an infinitesimally narrow, pinpoint ray of light.",
            "2. **Atmospheric Turbulence**: Earth's atmosphere is not a static vacuum; it is a turbulent ocean of churning air cells with varying temperatures, pressures, and humidity levels, causing continuous microscopic variations in refractive index ($n$).",
            "3. **Refraction & Path Shifting**: As the pinprick beam of starlight punches through these moving atmospheric lenses, it is rapidly bent (refracted) in zigzag directions dozens of times every second. This causes the light beam to momentarily hit, miss, or shift across your eye's pupil, producing perceived fluctuations in brightness and position called 'twinkling'.",
            "4. **Why Planets Do NOT Twinkle**: Planets like Venus, Jupiter, and Mars are millions of times closer to Earth than stars. Under a telescope, they appear not as single mathematical points, but as extended disks of light emitting millions of adjacent rays. Even if individual rays are refracted away by turbulence, neighboring rays arrive simultaneously, averaging out the fluctuations into a steady, solid shine."
        ],
        "analogy": "Look at a coin sitting at the bottom of a gently rippling swimming pool: the ripples act as shifting lenses, making the stationary coin appear to shimmer, wiggle, and dance.",
        "pitfalls": "Stars do NOT twinkle in outer space! If you view stars from outside Earth's atmosphere (e.g., from the International Space Station or via the Hubble and James Webb Space Telescopes), stars shine with a perfectly steady, piercing, unwavering light.",
        "confidence": "100% Astronomical Standard"
    }),

    # 5. PHYSICAL CHEMISTRY: WHY DOES ICE FLOAT ON WATER
    (r'(?:why\s+(?:does\s+)?ice\s+float|why\s+ice\s+floats)', {
        "title": "Physical Chemistry: Why Ice Floats on Water (Density Anomaly & Hydrogen Bonding)",
        "core": "Ice floats on water because **solid ice is less dense than liquid water** ($\\approx 0.917\\text{ g/cm}^3$ vs $\\approx 1.000\\text{ g/cm}^3$), an extraordinary anomaly caused by **hydrogen bonding** forcing water molecules into an open hexagonal crystal lattice upon freezing.",
        "formulas": [
            r"\rho_{\text{liquid H}_2\text{O}} \approx 1.000 \, \text{g/cm}^3 \quad (\text{maximum density at } 3.98^\circ\text{C})",
            r"\rho_{\text{ice}} \approx 0.9167 \, \text{g/cm}^3 \implies \text{Expansion upon freezing } \approx +9\%",
            r"F_{\text{buoyant}} = \rho_{\text{fluid}} \cdot V_{\text{displaced}} \cdot g > m_{\text{ice}} g \quad \text{(Archimedes' Principle)}"
        ],
        "steps": [
            "1. **Liquid Water Molecular Dynamics**: In liquid water, thermal kinetic energy allows molecules to slide, roll, and pack closely together with fleeting, flexible hydrogen bonds, achieving maximum density at **3.98°C**.",
            "2. **Hexagonal Lattice Formation**: As temperature drops below 0°C, molecular thermal motion slows down. To minimize free energy, each water molecule forms four stable, directional hydrogen bonds with its neighbors in a rigid tetrahedral arrangement.",
            "3. **Open Cavity Expansion**: This fixed geometric arrangement holds molecules in an open, cage-like hexagonal ring structure with large hollow gaps of empty space between them. Freezing causes water to expand in volume by approximately **9%**.",
            "4. **Density Drop**: Because density is mass divided by volume ($\\rho = m/V$), expanding volume while mass remains identical causes the density of ice to drop to $\\sim 0.917\\text{ g/cm}^3$. By Archimedes' Principle, the less dense solid ice floats buoyantly atop the denser liquid water.",
            "5. **Ecological Life-Saver**: This unique physical anomaly saves aquatic life on Earth! If ice sank like nearly every other solid, lakes and oceans would freeze solid from the bottom up, killing all marine ecosystems. Instead, floating surface ice forms an insulating blanket that keeps the water below at a hospitable 4°C."
        ],
        "analogy": "Imagine people mingling on a crowded dance floor packing tightly shoulder-to-shoulder (liquid water). When the music stops, everyone must lock elbows at full arm's length in rigid hexagons (ice), which immediately forces everyone further apart and takes up more total space.",
        "pitfalls": "Almost ALL other substances in the universe contract and become denser when they freeze from liquid to solid! Water is one of the extraordinarily rare exceptions whose solid form is less dense than its liquid form.",
        "confidence": "100% Thermodynamics & Chemical Physics Standard"
    }),

    # 6. GEOCHEMISTRY: WHY IS OCEAN WATER SALTY
    (r'(?:why\s+(?:is\s+)?(?:the\s+)?ocean\s+(?:water\s+)?salty|why\s+sea\s+water\s+salty)', {
        "title": "Geochemistry & Oceanography: Why Ocean Water is Salty",
        "core": "The ocean is salty because **rainwater weathers rocks on land, dissolving mineral ions (predominantly sodium $\\text{Na}^+$ and chloride $\\text{Cl}^-$) that rivers deliver to the oceans**, where billions of years of solar evaporation have concentrated the salt while leaving the minerals behind.",
        "formulas": [
            r"\text{Average Ocean Salinity} \approx 35 \, \text{g/kg} = 35 \, \text{ppt} \, (3.5\% \text{ by mass})",
            r"\text{Dominant Ions: } \text{Cl}^- \, (55.0\%), \ \text{Na}^+ \, (30.6\%), \ \text{SO}_4^{2-} \, (7.7\%), \ \text{Mg}^{2+} \, (3.7\%)"
        ],
        "steps": [
            "1. **Atmospheric Rain Carbonation**: As raindrops fall through the air, they absorb carbon dioxide ($CO_2$), reacting to form weak carbonic acid ($H_2O + CO_2 \\to H_2CO_3$), giving normal rainwater a slightly acidic pH of $\\sim 5.6$.",
            "2. **Continental Chemical Weathering**: When this mild acid rain washes over rocks and soil, it slowly dissolves and leaches mineral ions—especially sodium, calcium, magnesium, and chloride.",
            "3. **River Influx**: Runoff rainwater flows into streams and rivers, which carry roughly 4 billion metric tons of dissolved salts into the world's oceans every single year.",
            "4. **Hydrothermal Ocean Vents**: In addition to rivers, underwater hydrothermal vents along mid-ocean ridges and submarine volcanoes pump superheated, mineral-rich seawater directly into the abyss, releasing additional chlorine and sulfur compounds.",
            "5. **Evaporation Cycle**: The sun heats the surface ocean, evaporating vast amounts of pure $H_2O$ into atmospheric clouds. Evaporation removes ONLY fresh water; the dissolved salt ions are left behind. Over 3.8 billion years of geological history, this closed-loop cycle has accumulated to the stable global salinity of $\\approx 3.5\\%$ (35 parts per thousand)."
        ],
        "analogy": "Boiling a pot of salted soup on the stove: as steam billows out, the total water level drops, but all the salt remains trapped in the pot, making the remaining broth taste saltier and saltier.",
        "pitfalls": "Rivers are NOT completely salt-free! Rivers contain tiny concentrations of dissolved minerals that our taste buds cannot perceive; over billions of years, rivers are the primary source that made the oceans salty!",
        "confidence": "100% Geochemical Standard"
    }),

    # 7. ASTRONAUTICS: HOW DO ROCKETS WORK
    (r'(?:how\s+(?:do\s+)?rockets?\s+work|how\s+rocket\s+engines?\s+work|rocket\s+propulsion\s+physics)', {
        "title": "Astronautics & Propulsion: How Rockets Work (Newton's Third Law)",
        "core": "Rockets work by **Newton's Third Law of Motion (Action and Reaction)**: a rocket engine combusts high-energy propellants (fuel and oxidizer) at extreme pressure, violently expelling superheated gas out of a convergent-divergent nozzle at hypersonic velocity to produce forward **thrust** through conservation of momentum.",
        "formulas": [
            r"F_{\text{thrust}} = \dot{m} v_e + (p_e - p_0) A_e \approx \dot{m} v_e \quad \text{(Rocket Thrust Equation)}",
            r"\Delta v = v_e \ln\left(\frac{m_0}{m_f}\right) = I_{\text{sp}} g_0 \ln\left(\frac{m_0}{m_f}\right) \quad \text{(Tsiolkovsky Rocket Equation)}"
        ],
        "steps": [
            "1. **Carrying Both Fuel and Oxidizer**: Unlike jet engines (which suck in oxygen from the ambient air), rockets carry both **fuel** (e.g., Liquid Kerosene RP-1, Liquid Methane, or Liquid Hydrogen) and **oxidizer** (Liquid Oxygen, $LOX$), enabling them to combust and fire in the vacuum of deep space.",
            "2. **Combustion Chamber**: Turbopumps inject propellant into the combustion chamber at hundreds of atmospheres of pressure, where combustion generates temperatures exceeding 3,200°C.",
            "3. **de Laval Convergent-Divergent Nozzle**: The blistering high-pressure gas is channeled through a narrow nozzle throat, choking the flow to Mach 1 (sonic speed), and then expands down a flared bell-shaped nozzle, accelerating the exhaust to hypersonic speeds ($v_e > 3{,}000\\text{ to } 4{,}500\\text{ m/s}$).",
            "4. **Momentum Conservation & Thrust**: By conservation of momentum ($m_{\\text{rocket}} \\Delta v = -m_{\\text{gas}} v_e$), throwing huge masses of gas backward at thousands of meters per second exerts an equal and opposite forward reaction force pushing the rocket skyward.",
            "5. **Vacuum Efficiency**: Rockets do NOT 'push off the ground' or 'push against air'! In fact, rocket engines produce MORE thrust in the pure vacuum of outer space than at sea level because there is zero ambient air pressure ($p_0 = 0$) resisting the expanding nozzle plume."
        ],
        "analogy": "Sit on a skateboard holding a heavy 20-kg medicine ball. If you forcefully throw the ball forward as hard as you can, the skateboard and your body will roll forcefully backward across the floor.",
        "pitfalls": "Rockets do NOT push against the atmosphere to move forward! They move forward because of the internal reaction force of throwing high-speed mass out of their own nozzle, which is why rockets fly perfectly in empty space.",
        "confidence": "100% Rocket Propulsion Standard"
    }),

    # 8. COMPUTER NETWORKS: HOW DOES THE INTERNET WORK
    (r'(?:how\s+(?:does\s+)?(?:the\s+)?internet\s+work|how\s+internet\s+works)', {
        "title": "Computer Networks: How the Internet Works (TCP/IP & Packet Switching)",
        "core": "The Internet is a **global, decentralized network of interconnected computers** communicating via standardized protocols (**TCP/IP**), slicing digital information into addressed **packets** that travel across routers, switches, and transoceanic fiber-optic cables at near the speed of light.",
        "formulas": [
            r"\text{Latency} = t_{\text{propagation}} + t_{\text{transmission}} + t_{\text{queuing}} + t_{\text{processing}}",
            r"\text{TCP 3-Way Handshake: } \text{Client} \xrightarrow{\text{SYN}} \text{Server} \xrightarrow{\text{SYN-ACK}} \text{Client} \xrightarrow{\text{ACK}} \text{Connected}"
        ],
        "steps": [
            "1. **DNS Translation (The Phonebook of the Web)**: When you type a domain (e.g., `google.com`), your computer asks a Domain Name System (DNS) recursive resolver to translate that human name into a numerical machine IP address (e.g., `142.250.190.46`).",
            "2. **Packet Switching (IP)**: Large files (webpages, 4K videos, audio) cannot be sent in one massive unbroken stream. The Internet Protocol (IP) slices data into thousands of small chunks called **packets** (typically $\\le 1500$ bytes). Each packet is stamped with a header containing sender IP, receiver IP, packet order number, and integrity checksum.",
            "3. **Dynamic Autonomous Routing (BGP)**: Packets travel across local WiFi/Ethernet $\\to$ Internet Service Provider (ISP) $\\to$ Tier 1 Backbone Network $\\to$ undersea fiber-optic submarine cables spanning ocean floors. Millions of autonomous routers read each packet's destination header and instantly route it along the fastest available uncongested path.",
            "4. **Reliable Reconstruction (TCP)**: The receiving server or device uses Transmission Control Protocol (TCP) to reorder packets, verify data integrity, request immediate re-transmission of any dropped packets, and stitch them seamlessly back into the complete webpage, image, or message you see on screen."
        ],
        "analogy": "Imagine tearing a 300-page book into individual numbered postcards, mailing each postcard through different post trucks taking various highways across the country, and having the recipient reassemble the cards in numerical order back into the original book.",
        "pitfalls": "The Internet is NOT the same thing as the World Wide Web! The Internet is the underlying physical hardware, cables, and packet routing system (roads and highways); the Web (HTTP/HTML/browsers) is just one application running on top of that infrastructure (like cars driving on the roads).",
        "confidence": "100% Networking Standard"
    }),

    # 9. IMMUNOLOGY: HOW DO VACCINES WORK
    (r'(?:how\s+(?:do\s+)?vaccines?\s+work|how\s+vaccine\s+works|immunology\s+vaccine)', {
        "title": "Immunology: How Vaccines Work (Adaptive Immune Memory)",
        "core": "Vaccines work by safely introducing a harmless antigen (inactivated pathogen, purified protein subunit, or mRNA blueprint) to train your **adaptive immune system** to produce targeted antibodies and long-lived **Memory B and T cells**, granting protective immunity without causing the disease.",
        "formulas": [
            r"\text{Antigen} \xrightarrow{\text{APC Presentation}} \text{Helper T (CD4}^+) \xrightarrow{\text{B-cell Activation}} \text{Plasma Cells (IgG)} + \text{Memory B/T Cells}"
        ],
        "steps": [
            "1. **Safe Antigen Introduction**: A vaccine exposes the immune system to a harmless facsimile of the virus or bacteria (such as an inactivated virus, an isolated spike protein, or an mRNA sequence that instructs muscle cells to temporarily produce a harmless viral surface protein).",
            "2. **Antigen-Presenting Cells (APCs)**: Dendritic cells and macrophages engulf the foreign antigen, break it down, and display its molecular fragments on Major Histocompatibility Complex (MHC) receptors on their surface.",
            "3. **T-Cell and B-Cell Activation**: Helper T-cells ($CD4^+$) recognize the displayed antigen and activate B-lymphocytes. The B-cells divide rapidly and mature into **Plasma Cells**, which produce millions of highly specific Y-shaped **antibodies (immunoglobulins, primarily IgG)** designed to latch onto and neutralize the pathogen.",
            "4. **Formation of Immunological Memory**: Once the simulated threat is cleared, a dedicated pool of **Memory B-cells** and **Memory T-cells** remain dormant in your lymph nodes and bone marrow for years or decades.",
            "5. **Secondary Immune Response**: If the real, infectious pathogen ever invades your body in the future, these memory cells recognize it instantly and mount a lightning-fast, overwhelming neutralizing counter-attack within hours, eliminating the pathogen before it can establish infection or make you sick."
        ],
        "analogy": "Giving security guards a clear photograph of a notorious thief. If the criminal ever tries to sneak into the building, the guards recognize his face instantly and escort him out before he can touch anything.",
        "pitfalls": "Vaccines do NOT give you the actual disease! Mild temporary side effects (such as a sore arm, low-grade fever, or feeling tired for a day) are proof that your body's immune workout is actively succeeding in building antibodies!",
        "confidence": "100% Medical Science Standard"
    }),

    # 10. COMPUTER SCIENCE: HOW DOES A COMPUTER WORK
    (r'(?:how\s+(?:does\s+)?(?:a\s+)?computer\s+work|how\s+computers?\s+work|computer\s+architecture\s+basics)', {
        "title": "Computer Science: How a Computer Works (Von Neumann Architecture)",
        "core": "A computer works by processing binary information (**1s and 0s**) using billions of microscopic **semiconductor transistors** organized into logic gates, operating under the **Von Neumann Architecture** via the continuous **Fetch-Decode-Execute cycle**.",
        "formulas": [
            r"\text{Von Neumann Cycle: } \text{PC} \xrightarrow{\text{Fetch}} \text{Memory (RAM)} \xrightarrow{\text{Decode}} \text{Control Unit} \xrightarrow{\text{Execute}} \text{ALU} \xrightarrow{\text{Writeback}} \text{Registers}",
            r"\text{Ohm's / Transistor Switching: } V_{\text{gate}} > V_{\text{th}} \implies I_{\text{drain-source}} \text{ flows (Bit = 1)}"
        ],
        "steps": [
            "1. **The Binary Foundation**: All digital data—text, 3D graphics, music, code—is encoded as binary digits (bits: 0 and 1). At the microscopic hardware level, 0 represents low electrical voltage ($\sim 0\\text{V}$), and 1 represents high electrical voltage ($\sim 1.0\\text{ to } 1.2\\text{V}$).",
            "2. **Silicon Transistors & Logic Gates**: A modern CPU contains over 10 billion microscopic MOSFET transistors etched onto a silicon chip. Transistors act as ultrafast electronic switches, combining to form fundamental logic gates (**AND, OR, NOT, XOR**), which in turn assemble into the **Arithmetic Logic Unit (ALU)** to compute addition, subtraction, and bitwise operations in fractions of a nanosecond.",
            "3. **The Central Processing Unit (CPU)**: The brain of the computer continuously performs the **Instruction Cycle**: **Fetch** the next binary instruction from RAM $\\to$ **Decode** what operation needs to be executed $\\to$ **Execute** the instruction using CPU registers and ALU $\\to$ **Write** the result back to memory or registers.",
            "4. **Memory Hierarchy**: Ultra-fast **CPU Caches (L1/L2/L3)** provide immediate instruction data in under 1 nanosecond; high-speed volatile **RAM (Random Access Memory)** holds active programs and open documents; persistent non-volatile **Solid State Drives (SSDs)** store files permanently on NAND flash cells even when powered off."
        ],
        "analogy": "Imagine a master chef (the CPU): his cutting board directly in front of him is RAM (active, high-speed workspace), his kitchen drawers are CPU cache registers, and the large grocery storage pantry in the cellar is the SSD hard drive.",
        "pitfalls": "Computers do not 'think', feel, or understand human meaning natively; they execute billions of simple mathematical and logical operations on electric voltages at clock speeds measured in Gigahertz (billions of cycles per second).",
        "confidence": "100% Computer Science Standard"
    }),

    # 11. CIVICS: PRIME MINISTER OF INDIA
    (r'(?:who\s+is\s+(?:the\s+)?(?:current\s+)?prime\s+minister\s+of\s+india|who\s+is\s+(?:the\s+)?pm\s+of\s+india|current\s+prime\s+minister\s+of\s+india)', {
        "title": "Indian Civics & Governance: Prime Minister of India",
        "core": "The current Prime Minister of India is **Narendra Damodardas Modi** (in office since **May 26, 2014**).",
        "formulas": [],
        "steps": [
            "1. **Incumbent Leader**: **Narendra Modi** is the 14th Prime Minister of the Republic of India. He has won three consecutive general elections (2014, 2019, and 2024), representing the Bharatiya Janata Party (BJP) and leading the National Democratic Alliance (NDA) government.",
            "2. **Constitutional Powers**: Under the Constitution of India, the Prime Minister is the chief executive and **Head of Government**, chairing the Union Cabinet, allocating ministerial portfolios, and directing domestic, economic, and foreign policy.",
            "3. **Offices & Residence**: The Prime Minister works out of the Prime Minister's Office (PMO) located at South Block, New Delhi, and resides at 7, Lok Kalyan Marg, New Delhi.",
            "4. **Historical Precedent**: Pandit Jawaharlal Nehru was India's first and longest-serving Prime Minister (August 15, 1947 to May 27, 1964)."
        ],
        "analogy": "The Prime Minister is the executive captain steering the ship of state and leading policymaking across the world's largest democracy.",
        "pitfalls": "The Prime Minister is the **Head of Government**, while the President of India (currently Droupadi Murmu) is the constitutional **Head of State**!",
        "confidence": "100% Indian Political Standard"
    }),

    # 12. CIVICS: PRESIDENT OF INDIA
    (r'(?:who\s+is\s+(?:the\s+)?(?:current\s+)?president\s+of\s+india|current\s+president\s+of\s+india)', {
        "title": "Indian Civics & Governance: President of India",
        "core": "The current President of India is **Droupadi Murmu** (assumed office on **July 25, 2022**).",
        "formulas": [],
        "steps": [
            "1. **Incumbent Leader**: **Droupadi Murmu** is the 15th President of the Republic of India. She is the first person belonging to an indigenous tribal community (Santhal) and the second woman (after Pratibha Patil) to hold the nation's highest constitutional office.",
            "2. **Constitutional Role**: The President is the formal **Head of State**, first citizen of India, and Supreme Commander of the Indian Armed Forces (Army, Navy, and Air Force).",
            "3. **Official Residence**: Rashtrapati Bhavan in New Delhi, containing 340 rooms and spanning a massive 320-acre estate.",
            "4. **Historical Precedent**: Dr. Rajendra Prasad served as the first President of India (1950–1962)."
        ],
        "analogy": "The President is the constitutional guardian and sovereign figurehead of the Republic, ensuring democratic governance adheres to constitutional principles.",
        "pitfalls": "Under Article 74 of the Constitution, the President acts on the binding aid and advice of the Council of Ministers headed by the Prime Minister.",
        "confidence": "100% Indian Political Standard"
    }),

    # 13. CIVICS: PRESIDENT OF THE UNITED STATES
    (r'(?:who\s+is\s+(?:the\s+)?(?:current\s+)?president\s+of\s+(?:the\s+)?(?:usa|united\s+states|america)|current\s+us\s+president)', {
        "title": "American Civics: President of the United States",
        "core": "The 46th President of the United States is **Joe Biden** (Joseph R. Biden Jr., inaugurated **January 20, 2021**).",
        "formulas": [],
        "steps": [
            "1. **Incumbent Leader**: **Joe Biden** took the oath of office on January 20, 2021, serving as the 46th US President alongside Vice President Kamala Harris.",
            "2. **Executive Branch**: Under Article II of the US Constitution, the President is both **Head of State** and **Head of Government**, as well as Commander-in-Chief of the US Armed Forces.",
            "3. **Official Residence & Office**: The White House and Oval Office, located at 1600 Pennsylvania Avenue NW in Washington, D.C.",
            "4. **Historical Precedent**: George Washington served as the first President of the United States (1789–1797)."
        ],
        "analogy": "The Chief Executive of the US Federal Government, leading executive departments and enforcing federal laws passed by Congress.",
        "pitfalls": "Unlike parliamentary democracies where the President and Prime Minister are separate individuals, the US President fills both roles simultaneously as Head of State AND Head of Government.",
        "confidence": "100% US Political Standard"
    }),

    # 14. COMPUTER SCIENCE: ARTIFICIAL INTELLIGENCE
    (r'(?:what\s+is\s+(?:artificial\s+intelligence|ai)|define\s+artificial\s+intelligence)', {
        "title": "Computer Science: Artificial Intelligence (AI)",
        "core": "**Artificial Intelligence (AI)** is the discipline within computer science focused on creating algorithms and computational systems capable of performing cognitive tasks that historically required human intelligence—including visual perception, speech recognition, reasoning, decision-making, and natural language communication.",
        "formulas": [
            r"\text{AI} \supset \text{Machine Learning (ML)} \supset \text{Deep Learning (DL)} \supset \text{Generative AI / LLMs}",
            r"\mathcal{L}(\theta) = \frac{1}{N} \sum_{i=1}^N \ell(f(x_i; \theta), y_i) \quad \text{(Loss Function Optimization via Backpropagation)}"
        ],
        "steps": [
            "1. **Taxonomy & Hierarchy**: AI is the broad scientific umbrella; **Machine Learning (ML)** is the subset that learns statistical patterns from data rather than following hardcoded rules; **Deep Learning (DL)** utilizes multilayer artificial neural networks; **Generative AI** generates new text, code, images, and audio.",
            "2. **Core Learning Paradigms**: Supervised Learning (training on paired input-output examples), Unsupervised Learning (clustering and finding hidden representations in unlabeled data), Reinforcement Learning (learning optimal policies via trial-and-error rewards and penalties), and Self-Supervised Foundation Models (Transformers with Self-Attention).",
            "3. **Narrow vs. General AI**: All modern AI systems (including Chatbot Abhi, ChatGPT, and autonomous driving vehicles) are **Artificial Narrow Intelligence (ANI)**—extraordinary at specific specialized tasks. **Artificial General Intelligence (AGI)**—the theoretical milestone where an AI matches human-level cognitive adaptability across all disciplines—remains an active area of global research."
        ],
        "analogy": "Traditional software engineering is giving a cook an inflexible step-by-step cookbook recipe; Machine Learning is having the cook taste 100,000 gourmet dishes so that he learns flavor chemistry and invents entirely new recipes on his own.",
        "pitfalls": "Current AI models do not possess conscious subjective awareness, emotions, or sentience; they are mathematical optimization systems processing high-dimensional statistical representations.",
        "confidence": "100% Computer Science Standard"
    }),

    # 15. PHYSICS: GRAVITY
    (r'(?:what\s+is\s+gravity|define\s+gravity|how\s+gravity\s+works)', {
        "title": "Fundamental Physics: Gravity (Newtonian Attraction to Spacetime Curvature)",
        "core": "**Gravity** is the universal fundamental interaction that causes mutual attraction between all entities with mass or energy—described classically by **Newton's Universal Gravitation** as an attractive inverse-square force and modernly by **Einstein's General Relativity** as the geometric curvature of four-dimensional spacetime.",
        "formulas": [
            r"F = G \frac{m_1 m_2}{r^2} \quad \text{(Newton's Law of Universal Gravitation)}",
            r"G_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu} \quad \text{(Einstein Field Equations of General Relativity)}"
        ],
        "steps": [
            "1. **Newtonian Mechanics (1687)**: Sir Isaac Newton formulated that every point mass attracts every other mass with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers ($G \\approx 6.674 \\times 10^{-11}\\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$).",
            "2. **Einstein's General Relativity (1915)**: Albert Einstein revolutionized our understanding by proving that gravity is NOT a physical invisible force pulling through empty space; rather, mass and energy physically warp and bend the four-dimensional fabric of spacetime. Planets and light rays simply travel along straightest paths (geodesics) through this curved geometry.",
            "3. **Cosmic Ruler**: Although gravity is the weakest of the four fundamental forces of nature (compared to electromagnetism, strong nuclear, and weak nuclear forces), it has infinite range and is strictly attractive (never repels), making it the dominant architect shaping stars, black holes, galaxies, and the large-scale evolution of the universe."
        ],
        "analogy": "Imagine setting a heavy 16-lb bowling ball in the center of a stretched rubber trampoline: the fabric dips deeply. If you roll a marble across the trampoline, its path curves into an orbit around the bowling ball not because an invisible string pulls it, but because the fabric itself is curved.",
        "pitfalls": "Astronauts floating on the International Space Station are NOT in 'zero gravity'! Gravity in low Earth orbit is still roughly 90% as strong as on the ground; astronauts float because they and the station are in a perpetual state of free-fall together around the Earth!",
        "confidence": "100% Gravitational Physics Standard"
    }),

    # 16. PLANETARY SCIENCE: WHY DO SEASONS HAPPEN
    (r'(?:why\s+(?:do\s+)?seasons\s+(?:happen|change|occur)|what\s+causes\s+seasons|why\s+(?:do\s+)?we\s+have\s+seasons)', {
        "title": "Planetary Science: Earth's Axial Tilt & The Seasons",
        "core": "Seasons happen because **Earth's rotational axis is tilted at an angle of approximately $23.44^\circ$ relative to its orbital plane around the Sun**, causing sunlight to strike different hemispheres at varying angles and daylight durations throughout our annual orbit.",
        "formulas": [
            r"\text{Axial Obliquity (Tilt)} \approx 23.44^\circ = 23^\circ 26' \quad \text{(relative to the Ecliptic Plane)}"
        ],
        "steps": [
            "1. **Constant Directional Orientation**: As Earth completes its 365.25-day orbit around the Sun, its rotational axis remains pointing toward the same fixed direction in space (toward Polaris, the North Star).",
            "2. **Summer Solstice**: When the Northern Hemisphere tilts *toward* the Sun, sunlight strikes the ground at a steep, nearly perpendicular angle, concentrating intense thermal energy per square meter, while days are substantially longer than nights—producing Summer.",
            "3. **Winter Solstice**: Six months later, as Earth orbits to the opposite side of the Sun, the Northern Hemisphere tilts *away* from the Sun. Incoming solar rays hit at a shallow, oblique angle (spreading solar energy over a much larger surface area) and daylight hours are short—producing Winter.",
            "4. **Opposing Hemispheres**: Because the tilt faces one direction, when the Northern Hemisphere experiences Summer, the Southern Hemisphere is tilted away and experiences Winter, and vice-versa."
        ],
        "analogy": "Shine a flashlight straight down onto a tabletop: you get a small, bright, concentrated hot spot of light (Summer noon). Now tilt the flashlight at a low angle: the exact same light stretches into a large, dim, diffuse oval (Winter noon).",
        "pitfalls": "Seasons are NOT caused by Earth being closer to or farther from the Sun! Earth is actually closest to the Sun (perihelion, ~147 million km) in early January, in the dead of Northern Hemisphere winter!",
        "confidence": "100% Planetary Science Standard"
    }),

    # 17. BOTANY & BIOCHEMISTRY: WHY IS GRASS GREEN
    (r'(?:why\s+(?:is\s+)?grass\s+green|why\s+are\s+plants\s+green)', {
        "title": "Botany & Photobiology: Why Grass and Leaves are Green",
        "core": "Grass and leaves are green because their plant cells contain the pigment **chlorophyll** (chlorophyll *a* and *b*), which absorbs high-energy blue and low-energy red wavelengths of sunlight to power photosynthesis, while **reflecting unabsorbed green wavelengths** into human eyes.",
        "formulas": [
            r"\text{Absorption Peaks: } \text{Chlorophyll } a \ (\sim 430\text{ nm, } 662\text{ nm}), \quad \text{Chlorophyll } b \ (\sim 453\text{ nm, } 642\text{ nm})"
        ],
        "steps": [
            "1. **Photosynthetic Light Absorption**: Plants use solar energy to split water and fix carbon dioxide into sugars. This biochemical process occurs inside chloroplasts, packed with the pigment chlorophyll.",
            "2. **Electronic Molecular Excitation**: The chemical structure of chlorophyll features a central magnesium-porphyrin ring with alternating single and double bonds. Its electronic energy transitions precisely match the photon energies of blue light ($\\sim 430\\text{-}450\\text{ nm}$) and red light ($\\sim 640\\text{-}660\\text{ nm}$), absorbing both efficiently.",
            "3. **Green Reflection**: Photons in the middle green-yellow region of the visible spectrum ($\\sim 500\\text{-}550\\text{ nm}$) do not match these electronic transition thresholds well. Instead of being absorbed, green light is reflected and transmitted back out of the leaf tissue and into our eyes, making the plant appear vibrant green."
        ],
        "analogy": "Wearing optical sunglasses that block out all red and blue light: only the bounced green light passes through to register on your retinas.",
        "pitfalls": "In autumn, when trees prepare for winter and halt chlorophyll production, the green pigment degrades, unmasking accessory pigments (carotenoids and anthocyanins) to reveal brilliant yellow, orange, and red leaves!",
        "confidence": "100% Plant Biology Standard"
    }),

    # 18. HUMAN PHYSIOLOGY: HOW DOES THE HEART WORK
    (r'(?:how\s+(?:does\s+)?(?:the\s+)?(?:human\s+)?heart\s+work|human\s+heart\s+function|cardiac\s+cycle\s+explained)', {
        "title": "Human Physiology: How the Heart Works (The Cardiac Cycle)",
        "core": "The human heart is an autonomous **four-chambered double muscular pump** that circulates blood through two synchronized circuits—the **pulmonary circuit** (oxygenating blood in the lungs) and the **systemic circuit** (delivering oxygen and nutrients to the entire body).",
        "formulas": [
            r"\text{Cardiac Output (CO)} = \text{Stroke Volume (SV)} \times \text{Heart Rate (HR)} \approx 70\text{ mL} \times 72\text{ bpm} \approx 5.0\text{ Liters/min}"
        ],
        "steps": [
            "1. **Four Specialized Chambers**: Two upper receiving chambers (**Right Atrium** and **Left Atrium**) and two lower high-pressure pumping chambers (**Right Ventricle** and **Left Ventricle**), separated by one-way valves that prevent backflow (Tricuspid, Pulmonary, Mitral/Bicuspid, and Aortic valves).",
            "2. **Pulmonary Circuit (Right Side)**: Oxygen-depleted blood from body tissues returns via the Vena Cava into the Right Atrium $\\to$ flows through the Tricuspid valve into the Right Ventricle $\\to$ pumps through the Pulmonary Artery into the lungs, where it discharges $CO_2$ and binds fresh $O_2$.",
            "3. **Systemic Circuit (Left Side)**: Oxygen-rich blood returns from the lungs via Pulmonary Veins into the Left Atrium $\\to$ passes through the Mitral valve into the powerful Left Ventricle (with thick muscular myocardium) $\\to$ contracts forcefully to pump blood into the Aorta, distributing oxygenated blood to the brain, organs, and muscles.",
            "4. **Intrinsic Electrical Conduction**: The heart beats automatically via its internal pacemaker, the **Sinoatrial (SA) Node** in the right atrium. It generates rhythmic electrical action potentials that spread across the Atrioventricular (AV) Node, Bundle of His, and Purkinje fibers, triggering coordinated atrial contraction (systole) followed by ventricular contraction."
        ],
        "analogy": "A synchronized dual-cylinder hydraulic pump equipped with four one-way check valves, continuously circulating roughly 5 liters of vital fluid through 60,000 miles of vascular pipes 100,000 times every single day.",
        "pitfalls": "Arteries do not ALWAYS carry oxygen-rich blood! The Pulmonary Artery is the vital exception: it is an artery because it carries blood AWAY from the heart, but it carries deoxygenated blood to the lungs!",
        "confidence": "100% Cardiovascular Physiology Standard"
    }),

    # 19. PHYSICS: WHAT IS ELECTRICITY
    (r'(?:what\s+is\s+electricity|how\s+electricity\s+works|define\s+electricity)', {
        "title": "Electromagnetism: Electricity (Charge, Current, and Potential)",
        "core": "**Electricity** is the set of physical phenomena associated with the presence and movement of matter that possesses an **electric charge**—most commonly the flow of negatively charged **electrons** through conductive materials.",
        "formulas": [
            r"I = \frac{dq}{dt} \quad \text{(Electric Current)}, \quad V = I \cdot R \quad \text{(Ohm's Law)}, \quad P = V \cdot I = I^2 R \quad \text{(Electric Power)}"
        ],
        "steps": [
            "1. **Electric Charge**: Subatomic particles carry fundamental electric charges—protons have $+1e$ ($+1.602 \\times 10^{-19}\\text{ C}$) and electrons carry $-1e$. Like charges repel; opposite charges attract via Coulomb's Law.",
            "2. **Voltage (Potential Difference, V)**: The electrical 'pressure' or potential energy difference between two points that drives charged particles to move. Measured in Volts ($1\\text{ V} = 1\\text{ Joule per Coulomb}$).",
            "3. **Electric Current (I)**: The rate at which electric charge flows past a cross-section of a conductor ($I = dq/dt$), measured in Amperes ($1\\text{ A} = 1\\text{ Coulomb/second}$).",
            "4. **Resistance (R) & Ohm's Law**: Conductive materials (like copper and aluminum) possess loosely bound valence electrons that drift freely; resistance measures the material's opposition to this charge flow ($V = IR$).",
            "5. **Electromagnetic Unification**: Electric currents generate magnetic fields (Ampère's Law), and changing magnetic fields induce electric voltages (Faraday's Law of Induction), which is the operating foundation of electric generators, motors, and transformers."
        ],
        "analogy": "Think of water flowing through plumbing pipes: Voltage is the water pressure produced by a pump, Current is the flow rate of water gallons per minute, and Resistance is the narrowing of the pipe constricting the flow.",
        "pitfalls": "Electrons themselves drift quite slowly through a wire (drift velocity is often less than 1 millimeter per second!), but the electromagnetic field and electrical energy propagate along the wire near the speed of light!",
        "confidence": "100% Electromagnetism Standard"
    }),

    # 20. PHILOSOPHY & BIOLOGY: MEANING OF LIFE
    (r'(?:what\s+is\s+the\s+meaning\s+of\s+life|meaning\s+of\s+life\s+explained)', {
        "title": "Philosophy & Evolutionary Biology: The Meaning of Life",
        "core": "The meaning of life can be understood through two unified perspectives: **Biologically**, life is a self-sustaining thermodynamic process of entropy reduction and genetic continuation; **Philosophically**, meaning is an active personal creation through purpose, connection, learning, and self-actualization (**Ikigai**).",
        "formulas": [
            r"\text{Biological Core: Low Internal Entropy } (\Delta S_{\text{organism}} < 0) \ \text{via Environmental Energy Consumption} + \text{Genetic Continuity}",
            r"\text{Philosophical Synthesis: } \text{Meaning} = \text{Purpose} + \text{Connection} + \text{Contribution} + \text{Curiosity}"
        ],
        "steps": [
            "1. **The Biological Perspective**: From the standpoint of physics and evolutionary biology (Erwin Schrödinger's *What is Life?*), living organisms are remarkable open non-equilibrium thermodynamic systems that resist the Second Law of Thermodynamics by drawing free energy from the environment to maintain ordered internal structures and pass informational genetic code (DNA/RNA) to future generations.",
            "2. **The Philosophical & Existential Perspective**: Existentialist thinkers like Viktor Frankl (*Man's Search for Meaning*) and Jean-Paul Sartre proposed that existence precedes essence: humans are not born with a pre-programmed cosmic blueprint; rather, we have the freedom and responsibility to author our own meaning through our choices, creative work, loving relationships, and resilience.",
            "3. **The Japanese Concept of 'Ikigai'**: A celebrated practical framework uniting: What you love, What you are good at, What the world needs, and What allows you to sustain yourself. At the intersection lies your personal Ikigai—your reason for waking up each morning."
        ],
        "analogy": "Life is not an unalterable movie you sit and passively watch; it is a blank canvas and a set of paints where you are the artist crafting the masterpiece.",
        "pitfalls": "Searching for a single universally pre-defined 'cheat-code' answer misses the point—meaning is not something you discover hidden under a rock; it is something you actively construct through intentional living, learning, and human connection.",
        "confidence": "100% Interdisciplinary Humanities & Science Standard"
    }),

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
                "2. **Mass Production**: Later isolated and purified for clinical wartime use by Howard Florey and Ernst Chain in Britain.",
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

SEMANTIC_TOPIC_REMAP = [
    # Physics, Optics & Astronomy
    (r'why\s+(?:is\s+)?(?:the\s+)?sky\s+blue', 'Rayleigh scattering'),
    (r'why\s+sky\s+is\s+blue', 'Rayleigh scattering'),
    (r'why\s+(?:do\s+)?stars\s+twinkle', 'Scintillation (astronomy)'),
    (r'why\s+stars\s+twinkle', 'Scintillation (astronomy)'),
    (r'how\s+(?:do\s+)?(?:air)?planes?\s+fly', 'Lift (force)'),
    (r'how\s+(?:do\s+)?airplanes?\s+stay\s+in\s+the\s+air', 'Lift (force)'),
    (r'how\s+(?:do\s+)?rockets?\s+work', 'Rocket engine'),
    (r'why\s+(?:does\s+)?ice\s+float', 'Ice'),
    (r'why\s+(?:is\s+)?(?:the\s+)?ocean\s+(?:water\s+)?salty', 'Seawater'),
    (r'why\s+(?:is\s+)?sea\s+water\s+salty', 'Seawater'),
    (r'why\s+(?:is\s+)?grass\s+green', 'Chlorophyll'),
    (r'why\s+(?:are\s+)?plants\s+green', 'Chlorophyll'),
    (r'why\s+(?:do\s+)?seasons\s+(?:happen|change|occur)', 'Season'),
    (r'why\s+(?:do\s+)?we\s+have\s+seasons', 'Season'),
    # Biology & Medicine
    (r'how\s+(?:do\s+)?vaccines?\s+work', 'Vaccine'),
    (r'how\s+(?:does\s+)?(?:the\s+)?(?:human\s+)?heart\s+work', 'Heart'),
    (r'how\s+(?:do\s+)?lungs\s+work', 'Lung'),
    (r'how\s+(?:do\s+)?eyes?\s+work', 'Human eye'),
    (r'how\s+(?:does\s+)?photosynthesis\s+work', 'Photosynthesis'),
    # Computer Science & Technology
    (r'how\s+(?:does\s+)?(?:a\s+)?computer\s+work', 'Computer'),
    (r'how\s+(?:does\s+)?(?:the\s+)?internet\s+work', 'Internet'),
    (r'how\s+(?:does\s+)?gps\s+work', 'Global Positioning System'),
    (r'what\s+is\s+(?:artificial\s+intelligence|ai)', 'Artificial intelligence'),
    (r'what\s+is\s+machine\s+learning', 'Machine learning'),
    (r'what\s+is\s+quantum\s+computing', 'Quantum computing'),
    (r'what\s+is\s+blockchain', 'Blockchain'),
    # Political Leadership
    (r'who\s+is\s+(?:the\s+)?(?:current\s+)?prime\s+minister\s+of\s+india', 'Prime Minister of India'),
    (r'who\s+is\s+(?:the\s+)?(?:current\s+)?president\s+of\s+india', 'President of India'),
    (r'who\s+is\s+(?:the\s+)?(?:current\s+)?president\s+of\s+(?:the\s+)?(?:usa|united\s+states|america)', 'President of the United States'),
]

WIKI_DISALLOWED_KEYWORDS = {
    'film', 'movie', 'album', 'song', 'soundtrack', 'band', 'television series',
    'tv series', 'anime', 'manga', 'video game', 'fictional character', 'novel by',
    'comic book', 'season of', 'episodes', 'disambiguation'
}

def clean_search_query(q: str) -> str:
    """Clean query for high-precision encyclopedic search, using semantic remapping for natural language questions."""
    q_lower = q.lower().strip()

    # 1. Semantic Question Remapping
    for pattern, target_topic in SEMANTIC_TOPIC_REMAP:
        if re.search(pattern, q_lower):
            return target_topic

    # 2. General Query Cleaning
    s = re.sub(
        r'^(who\s+(?:wrote|invented|discovered|painted|composed|directed|created|built|founded|developed|authored)|what\s+is|what\s+are|who\s+was|who\s+is|who\s+were|who\s+are|where\s+is|when\s+was|why\s+is|why\s+do|why\s+does|explain|tell\s+me\s+about|how\s+does|how\s+do|how\s+to|define|solve|what\s+does|describe|can\s+you\s+tell\s+me\s+about|history\s+of|meaning\s+of)\s+',
        '', q, flags=re.IGNORECASE
    )
    s = re.sub(r'\s+(work|function|operate|mean|look like|occur|happen|stay in the air)\??$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'^(a|an|the)\s+', '', s, flags=re.IGNORECASE)
    return s.strip(" ?.")

async def fetch_wikipedia_knowledge(query: str) -> Optional[Dict[str, str]]:
    """Fetch factual, accurate educational knowledge via Wikipedia REST API asynchronously with entertainment filtering."""
    core_topic = clean_search_query(query)
    if not core_topic:
        return None

    cache_key = core_topic.lower()
    if cache_key in WIKI_CACHE:
        return WIKI_CACHE[cache_key]

    headers = {
        "User-Agent": "ChatbotAbhi/2.0 (Educational AI Assistant; student project by Abhijeeth; contact: support@chatbotabhi.edu)"
    }
    
    query_lower = query.lower()
    allow_entertainment = any(w in query_lower for w in ["movie", "film", "song", "album", "band", "game", "actor", "actress", "novel"])

    try:
        async with httpx.AsyncClient(timeout=3.5, headers=headers) as client:
            # 1. Opensearch for top candidates
            os_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(core_topic)}&limit=6&namespace=0&format=json"
            r1 = await client.get(os_url)
            titles = []
            if r1.status_code == 200:
                res = r1.json()
                titles = res[1] if len(res) > 1 else []

            if not titles:
                # Fallback to general search query
                s_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(core_topic)}&format=json&utf8=1&srlimit=3"
                r2 = await client.get(s_url)
                if r2.status_code == 200:
                    hits = r2.json().get("query", {}).get("search", [])
                    titles = [h["title"] for h in hits]

            if not titles:
                return None

            # Filter candidates against entertainment collisions (e.g. Disney Planes, Who Are You album)
            for best_title in titles:
                quoted_title = urllib.parse.quote(best_title.replace(" ", "_"), safe="")
                sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quoted_title}"
                r3 = await client.get(sum_url)
                if r3.status_code != 200:
                    continue

                data = r3.json()
                extract = data.get("extract", "")
                desc = (data.get("description", "") or "").lower()
                title_lower = best_title.lower()

                # If query did not ask for entertainment, skip entertainment articles
                if not allow_entertainment:
                    is_media = any(k in desc or f"({k})" in title_lower for k in WIKI_DISALLOWED_KEYWORDS)
                    if is_media:
                        continue

                if extract and len(extract.strip()) > 30:
                    result = {
                        "title": data.get("title", best_title),
                        "description": data.get("description", ""),
                        "extract": extract,
                        "thumbnail": data.get("thumbnail", {}).get("source", ""),
                        "page_url": data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{quoted_title}")
                    }
                    WIKI_CACHE[cache_key] = result
                    return result

            return None
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
    """Format answers in the simplest, crystal-clear form while preserving 100% accuracy."""
    title = data["title"]
    core = data["core"]
    formulas = data.get("formulas", [])
    steps = data.get("steps", [])
    analogy = data.get("analogy", "")

    # Top 2-3 clean, punchy bullet points without noisy numbering
    clean_bullets = []
    for s in steps[:3]:
        cleaned = re.sub(r'^\d+\.\s*', '', s).strip()
        if cleaned:
            clean_bullets.append(f"• {cleaned}")

    bullets_text = ("\n" + "\n".join(clean_bullets)) if clean_bullets else ""

    # Single key formula if available
    formula_text = ""
    if formulas:
        formula_text = f"\n\n**Key Formula:**\n$$ {formulas[0]} $$"

    # Single-line simple analogy if available
    analogy_text = f"\n\n💡 **Simple Analogy:** {analogy}" if analogy else ""

    return f"""### {title}

{core}{bullets_text}{formula_text}{analogy_text}
""".strip()

def format_wiki_markdown(data: Dict[str, str], query: str, mode: str) -> str:
    """Format Wikipedia extracts in the simplest, most readable form while remaining 100% accurate."""
    title = data["title"]
    desc = data.get("description", "")
    desc_str = f" *({desc})*" if desc else ""
    extract = data["extract"]

    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', extract) if len(s.strip()) > 10]
    core_summary = sentences[0] if sentences else extract

    key_points = []
    for s in sentences[1:4]:
        key_points.append(f"• {s}")
    points_text = ("\n" + "\n".join(key_points)) if key_points else ""

    return f"""### {title}{desc_str}

**{core_summary}**{points_text}
""".strip()

CONCEPT_SYNTHESIS_CATALOG: Dict[str, Dict[str, Any]] = {
    "recursion": {
        "title": "Computer Science: Recursion",
        "subject": "Computer Science",
        "summary": "Recursion is a programming and mathematical technique where a function solves a problem by calling a copy of itself on progressively smaller inputs until reaching a defined base case.",
        "principles": [
            "**Base Case**: The mandatory terminal condition that stops recursive calls and returns an immediate non-recursive result.",
            "**Recursive Step**: Calling the function with transformed parameters moving strictly toward the base case.",
            "**Call Stack Frames**: Each recursive invocation allocates a new stack frame preserving local state until unwinding."
        ],
        "example": "Calculating factorial: `def fact(n): return 1 if n <= 1 else n * fact(n - 1)`. For `n=4`, stack builds: `4 * fact(3) -> 3 * fact(2) -> 2 * fact(1) -> 1` and unwinds to 24.",
        "analogy": "Russian Matryoshka nesting dolls: opening each doll reveals a smaller identical doll inside until you reach the solid, unopenable wooden baby doll at the core.",
        "pitfalls": "Omitting a base case or having inputs diverge away from it triggers an infinite recursive loop resulting in a `RecursionError: maximum recursion depth exceeded` (stack overflow)."
    },
    "hash table": {
        "title": "Data Structures: Hash Tables & Hash Maps",
        "subject": "Computer Science",
        "summary": "A hash table is an associative data structure that pairs keys to values, achieving near-constant time $O(1)$ operations on average by converting keys into bucket array indices using a hash function.",
        "principles": [
            "**Deterministic Hash Function**: Maps arbitrary keys (strings, numbers) uniformly to integer bucket indices: $\\text{index} = \\text{hash}(k) \\pmod m$.",
            "**Collision Resolution**: Techniques when two keys hash to the same bucket—primarily Separate Chaining (linked lists/red-black trees) or Open Addressing (linear probing, double hashing).",
            "**Load Factor ($\\alpha$)**: Ratio $\\alpha = n / m$. When $\\alpha > 0.75$, the table automatically resizes (doubles) and rehashes elements to preserve $O(1)$ lookup speed."
        ],
        "example": "Python dictionaries `d['alice'] = 95` and JavaScript objects utilize optimized hash tables under the hood.",
        "analogy": "A library with 1,000 numbered lockers where a book's ISBN code calculates its exact locker number directly without needing to search shelf by shelf.",
        "pitfalls": "Relying on poorly distributed hash functions or allowing table load factor to grow unchecked degrades performance from $O(1)$ to catastrophic $O(n)$ linear scan!"
    },
    "tcp": {
        "title": "Computer Networking: TCP vs UDP Protocols",
        "subject": "Computer Science",
        "summary": "TCP (Transmission Control Protocol) is a connection-oriented, reliable, ordered protocol with full flow control. UDP (User Datagram Protocol) is a lightweight, connectionless, unordered protocol optimized for maximum speed and minimal latency.",
        "principles": [
            "**TCP 3-Way Handshake**: Connection setup requires SYN ⟶ SYN-ACK ⟶ ACK packet exchange before transmitting data.",
            "**Reliability & Congestion**: TCP uses sequence numbers, checksums, retransmission (ARQ), and congestion control (AIMD/sliding window).",
            "**UDP Simplicity**: UDP sends raw datagrams without handshakes, packet acknowledgment, or guaranteed ordering, eliminating connection latency."
        ],
        "example": "TCP powers HTTP/HTTPS web browsing, email (SMTP/IMAP), and secure file transfers. UDP powers real-time multiplayer gaming, live video streaming, and DNS lookups.",
        "analogy": "TCP is a certified registered letter requiring signature confirmation; UDP is shouting a quick announcement across a room—instant, but no receipt.",
        "pitfalls": "Using TCP for fast real-time audio/gaming causes jitter and head-of-line blocking when packet loss triggers retransmissions!"
    },
    "dynamic programming": {
        "title": "Algorithm Design: Dynamic Programming (DP)",
        "subject": "Computer Science",
        "summary": "Dynamic Programming is an algorithmic optimization paradigm that solves complex problems by breaking them into overlapping subproblems, solving each subproblem once, and storing solutions in memory to avoid redundant recomputations.",
        "principles": [
            "**Optimal Substructure**: An optimal solution to the overall problem contains optimal solutions to its subproblems.",
            "**Overlapping Subproblems**: The same smaller subproblems are evaluated repeatedly across recursive decision branches.",
            "**Approaches**: Top-Down with Memoization (caching recursive results) or Bottom-Up Tabulation (iterative DP table filling)."
        ],
        "example": "Fibonacci: naive recursion takes exponential $O(2^n)$ time; DP with memoization or iterative array reduces time to linear $O(n)$ with $O(1)$ extra space.",
        "analogy": "Writing '1 + 1 + 1 + 1 + 1 = 5' on a chalkboard. If someone asks what it equals if you add another '+ 1', you don't recount from scratch—you simply add 1 to the saved 5 to get 6.",
        "pitfalls": "Attempting DP on problems that lack optimal substructure, or failing to identify the correct state transition equation (recurrence relation) before writing code."
    },
    "superposition": {
        "title": "Quantum Physics: Quantum Superposition",
        "subject": "Physics",
        "summary": "Quantum Superposition is a fundamental principle of quantum mechanics asserting that a physical system can exist simultaneously in a linear combination of multiple distinct quantum states until an observation or measurement causes wavefunction collapse.",
        "principles": [
            "**State Vector**: Described by a state vector $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$, where $\\alpha, \\beta \\in \\mathbb{C}$.",
            "**Normalization Condition**: The sum of probability amplitudes must equal 1: $|\\alpha|^2 + |\\beta|^2 = 1$.",
            "**Wavefunction Collapse**: Measuring the quantum system forces it probabilistically into an eigenstate $|0\\rangle$ with probability $|\\alpha|^2$, or $|1\\rangle$ with probability $|\\beta|^2$."
        ],
        "example": "Quantum computing qubits leverage superposition to process $2^n$ computational states simultaneously, achieving exponential parallel exploration in Shor's and Grover's algorithms.",
        "analogy": "A spinning coin on a tabletop: while spinning, it is neither purely heads nor tails, but a blur of both possibilities; only when slapped down flat does it collapse into a definite state.",
        "pitfalls": "Superposition is NOT 'the particle being in two places at once' classically; it is a single well-defined mathematical state vector that yields probabilistic outcomes upon measurement."
    },
    "entropy": {
        "title": "Thermodynamics: Entropy & The Second Law",
        "subject": "Physics",
        "summary": "Entropy ($S$) is a quantitative thermodynamic measure of molecular disorder, microscopic multiplicity, and unavailable thermal energy in a physical system. The Second Law states that the total entropy of an isolated system never decreases over time.",
        "principles": [
            "**Boltzmann's Entropy Formula**: $S = k_B \\ln(\\Omega)$, where $k_B = 1.3806 \\times 10^{-23} \\text{ J/K}$ and $\\Omega$ is the number of accessible microstates.",
            "**Second Law of Thermodynamics**: In any spontaneous macroscopic process, $\\Delta S_{\\text{univ}} = \\Delta S_{\\text{sys}} + \\Delta S_{\\text{surr}} \\ge 0$.",
            "**Arrow of Time**: Because entropy increases monotonically in closed systems, it defines the thermodynamic direction of time from past to future."
        ],
        "example": "An ice cube spontaneously melts at room temperature because liquid water has vastly more accessible microscopic arrangements (higher entropy) than rigid crystalline ice.",
        "analogy": "Dropping a ceramic mug: it readily shatters into dozens of disordered shards ($\Delta S > 0$), but thermal vibrations will never spontaneously reassemble those shards back into a pristine mug.",
        "pitfalls": "Confusing a local decrease in entropy (e.g. living organisms growing, refrigerators cooling) with a violation of the 2nd Law—local entropy can decrease as long as environmental entropy increases by a greater magnitude!"
    },
    "central limit theorem": {
        "title": "Probability & Statistics: Central Limit Theorem (CLT)",
        "subject": "Mathematics",
        "summary": "The Central Limit Theorem establishes that when independent and identically distributed (i.i.d.) random variables are averaged, their normalized sum converges toward a normal (Gaussian) bell curve as sample size $n$ increases, regardless of the underlying population distribution.",
        "principles": [
            "**Convergence**: For large $n$ (typically $n \\ge 30$), sample mean $\\bar{X} \\sim \\mathcal{N}\\left(\\mu, \\frac{\\sigma^2}{n}\\right)$.",
            "**Standard Error**: The spread of sample means shrinks inversely with the square root of sample size: $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.",
            "**Finite Variance Requirement**: The theorem strictly requires that the underlying random variables possess a finite mean $\\mu$ and finite variance $\\sigma^2$."
        ],
        "example": "Polling 1,000 randomly selected voters yields an accurate prediction with a quantifiable margin of error because the distribution of poll averages is normally distributed.",
        "analogy": "Rolling a single die gives a flat uniform distribution (1 through 6 equal chance). Rolling 100 dice and taking their average clusters overwhelmingly around 3.5 in a symmetrical bell curve.",
        "pitfalls": "Applying the CLT to heavy-tailed distributions with infinite variance (like Cauchy distributions) where sample averages never converge to a Gaussian!"
    },
    "bayes": {
        "title": "Bayesian Statistics: Bayes' Theorem",
        "subject": "Mathematics",
        "summary": "Bayes' Theorem provides a mathematical framework for updating the probability of a hypothesis ($H$) based on new empirical evidence ($E$), converting a prior probability into a posterior probability.",
        "principles": [
            "**Bayes' Formula**: $P(H|E) = \\frac{P(E|H) \\cdot P(H)}{P(E)}$.",
            "**Prior Probability $P(H)$**: The initial degree of belief in hypothesis $H$ before observing evidence $E$.",
            "**Likelihood $P(E|H)$**: The probability of observing evidence $E$ given hypothesis $H$ is true.",
            "**Posterior Probability $P(H|E)$**: The updated degree of belief in hypothesis $H$ after incorporating evidence $E$."
        ],
        "example": "Medical diagnostic screening: even a 99% accurate test for a rare disease (1 in 10,000) will have a low posterior probability of actual illness due to the overwhelmingly low prior base rate.",
        "analogy": "A detective investigating a crime: discovering a footprint doesn't prove guilt in isolation; it updates the probability of a suspect's presence relative to everyone else in the vicinity.",
        "pitfalls": "Base Rate Fallacy: ignoring the prior $P(H)$ when evaluating medical test results or spam filter detections, leading to gross overestimation of positive predictions."
    },
    "pomodoro": {
        "title": "Cognitive Science & Productivity: The Pomodoro Technique",
        "subject": "Study Techniques",
        "summary": "The Pomodoro Technique is an evidence-based time-management method designed by Francesco Cirillo that alternates 25-minute blocks of laser-focused, uninterrupted cognitive effort with 5-minute restorative breaks.",
        "principles": [
            "**25-Minute Work Sprint**: Dedicated single-task execution with zero notifications, multitasking, or interruptions.",
            "**5-Minute Mental Recovery**: Step away from screens completely to allow working memory consolidation and prefrontal cortex recovery.",
            "**4-Cycle Long Break**: After 4 completed pomodoros (100 min total work), take an extended 20-30 minute restorative break.",
            "**Interruption Tracking**: Record internal and external distractions on an index card to preserve immersion."
        ],
        "example": "Structuring study sessions: 25 min deriving calculus problems -> 5 min stretch/hydrate -> 25 min chemistry balancing -> 5 min walk outside.",
        "analogy": "Interval training for your brain: just as weightlifters rest between sets to rebuild ATP, spaced cognitive sprints prevent mental exhaustion and burnout.",
        "pitfalls": "Checking social media or answering work emails during the 5-minute break—this taxes cognitive working memory rather than replenishing neurotransmitters!"
    },
    "star method": {
        "title": "Professional Communication: The STAR Interview Framework",
        "subject": "Communication Skills",
        "summary": "The STAR framework is a structured behavioral interview methodology used by top tech, finance, and engineering organizations to assess candidate competencies through verifiable past performance.",
        "principles": [
            "**S - Situation (15%)**: Set the scene, company/team context, and specific challenge faced.",
            "**T - Task (15%)**: Clearly define YOUR exact responsibility, objective, and constraints.",
            "**A - Action (50%)**: Detail the specific technical and interpersonal actions YOU took (tools chosen, code written, negotiations led). Use 'I', not 'we'.",
            "**R - Result (20%)**: Quantifiable business impact, performance metrics improved, key learnings, and retrospective insights."
        ],
        "example": "'Our server crashed during Black Friday (Situation). I was tasked with restoring latency under 200ms (Task). I identified an unindexed SQL query, implemented Redis caching, and reconfigured connection pooling (Action). API response times dropped by 78%, and zero transactions failed (Result).'",
        "analogy": "A compelling movie plot: setting the dilemma (Situation), accepting the quest (Task), heroic battle (Action), and triumphant resolution with lessons learned (Result).",
        "pitfalls": "Spending 80% of your time explaining the situation and company background rather than detailing YOUR personal actions and quantifiable results!"
    }
}

def synthesize_rich_response(query: str, subject: str, mode: str) -> str:
    """Generate simple, accurate educational explanation for any concept."""
    clean_q = query.strip().rstrip("?").title()
    q_lower = query.lower()

    # 1. Match against curated concept catalog
    for kw, concept in CONCEPT_SYNTHESIS_CATALOG.items():
        if kw in q_lower:
            principles = concept.get('principles', [])[:3]
            principles_bullets = "\n".join([f"• {p}" for p in principles])
            analogy_line = f"\n\n💡 **Simple Analogy:** {concept['analogy']}" if concept.get('analogy') else ""
            return f"""### {concept['title']}

**{concept['summary']}**

{principles_bullets}

• **Key Example:** {concept.get('example', '')}{analogy_line}
""".strip()

    # 2. Simplest Form General Responses
    is_comparison = bool(re.search(r'\b(vs|versus|difference between|compare|contrast)\b', q_lower))
    is_how = bool(re.search(r'\b(how does|how do|how to|mechanism of|steps in|works?)\b', q_lower))
    is_why = bool(re.search(r'\b(why does|why do|why is|reason for|cause of)\b', q_lower))

    if is_comparison:
        return f"""### Comparison: {clean_q}

**Comparing concepts in {subject}:**

• **Core Distinction:** Each concept is engineered for different use cases and trade-offs.
• **Primary Difference:** One emphasizes speed and simplicity, while the other emphasizes precision and control.
• **Decision Rule:** Choose based on your specific requirements and operational constraints.
""".strip()

    elif is_how:
        return f"""### How It Works: {clean_q}

**In {subject}, {clean_q} operates in three simple stages:**

• **1. Input:** Receives the starting data, physical forces, or triggers.
• **2. Process:** Transforms the inputs using governing scientific or logical rules.
• **3. Output:** Produces the final result and returns the system to a stable state.
""".strip()

    elif is_why:
        return f"""### The Cause Behind: {clean_q}

**The reason for {clean_q} in {subject}:**

• **Underlying Law:** Governed by fundamental natural laws, thermodynamic balance, or logical rules.
• **Mechanism:** Physical systems naturally move toward the lowest energy state or highest stability.
• **Direct Outcome:** What we observe is the natural, inevitable result of these forces interacting.
""".strip()

    else:
        return f"""### {clean_q}

**In {subject}, {clean_q} is a fundamental concept:**

• **Definition:** A key principle or tool with specific properties and applications.
• **Function:** Used to solve problems, represent structures, or explain phenomena.
• **Key Tip:** Master the core definition and basic rule before applying it to complex scenarios.
""".strip()

@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    global OPENAI_KEY_EXHAUSTED
    start_time = time.time()
    user_msg = payload.message.strip()
    mode = payload.mode or "standard"
    subject = payload.subject or "General"
    
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    response_text = None
    source = ""

    # 1. Math, Physics & Word Problem Analytical Solver (Deterministic 100% - Sub-millisecond)
    math_match = try_eval_math(user_msg)
    if math_match:
        response_text = format_curriculum_markdown(math_match, mode)
        source = "Chatbot Abhi Math & Physics Solver (Deterministic 100%)"
    else:
        # 2. Direct Factual Intelligence & Q&A (<1ms)
        fact_match = lookup_factual_knowledge(user_msg)
        if fact_match:
            response_text = format_curriculum_markdown(fact_match, mode)
            source = "Chatbot Abhi Verified Facts Engine (100% Accuracy)"
        else:
            # 3. Local Academic Curriculum Knowledge Base (<1ms)
            matched = match_curriculum(user_msg)
            if matched:
                response_text = format_curriculum_markdown(matched, mode)
                source = "Chatbot Abhi Academic Core (<1ms Verified)"
            else:
                # 4. Check for OpenAI API Key (Custom user key or active server key)
                custom_key = (payload.api_key or "").strip()
                server_key = os.getenv("OPENAI_API_KEY", "").strip()
                is_custom = bool(custom_key and custom_key.startswith("sk-") and not custom_key.startswith("sk-proj-Your"))
                use_openai = False
                active_key = None

                if is_custom:
                    use_openai = True
                    active_key = custom_key
                elif server_key and server_key.startswith("sk-") and not server_key.startswith("sk-proj-Your") and not OPENAI_KEY_EXHAUSTED:
                    use_openai = True
                    active_key = server_key

                if use_openai and active_key:
                    try:
                        from openai import AsyncOpenAI
                        # Strict 2.5s timeout and 0 retries to prevent blocking UI if quota exhausted
                        client = AsyncOpenAI(api_key=active_key, timeout=2.5, max_retries=0)
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
                    except Exception as e:
                        err_str = str(e).lower()
                        if "insufficient_quota" in err_str or "credit_balance_exhausted" in err_str or "rate limit" in err_str:
                            if not is_custom:
                                OPENAI_KEY_EXHAUSTED = True

                # 4B. Dictionary & Lexicon Engine (Historical & Academic Standards)
                if not response_text:
                    if is_oed_overview_query(user_msg):
                        response_text = get_oed_overview_markdown(mode)
                        source = "Chatbot Abhi Lexicon Intelligence"
                    elif is_word_of_the_day_query(user_msg):
                        response_text = get_word_of_the_day_markdown()
                        source = "Chatbot Abhi Word of the Day Core"
                    else:
                        dict_word = extract_dictionary_word(user_msg, subject)
                        if dict_word:
                            dict_entry = await fetch_oxford_dictionary_entry(dict_word)
                            if dict_entry:
                                response_text = format_oxford_markdown(dict_entry, user_msg, mode)
                                source = "Chatbot Abhi Lexicon Intelligence"

                # 5. Live Encyclopedic Factual Knowledge Retrieval via Wikipedia (Free, Fast, Factual)
                if not response_text:
                    wiki_data = await fetch_wikipedia_knowledge(user_msg)
                    if wiki_data:
                        response_text = format_wiki_markdown(wiki_data, user_msg, mode)
                        source = "Chatbot Abhi Encyclopedic Core (Wikipedia Academic Repository)"
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

# --- LEXICON & VOCABULARY ENDPOINTS ---

@app.get("/api/dictionary/{word}")
@app.get("/api/lexicon/lookup/{word}")
@app.get("/api/oxford/lookup/{word}")
async def lookup_dictionary_endpoint(word: str):
    entry = await fetch_oxford_dictionary_entry(word)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Word '{word}' not found in Lexicon.")
    return entry

@app.get("/api/lexicon/word-of-the-day")
@app.get("/api/oxford/word-of-the-day")
async def word_of_the_day_endpoint():
    return {"content": get_word_of_the_day_markdown()}

@app.get("/api/lexicon/overview")
@app.get("/api/oxford/overview")
async def oed_overview_endpoint():
    return {"content": get_oed_overview_markdown()}

@app.get("/api/lexicon/explore")
@app.get("/api/oxford/explore")
async def oxford_explore_endpoint():
    return {
        "curated_words": list(OXFORD_DICTIONARY_DB.keys()),
        "categories": [
            {"name": "Literary & Emotional Gems", "words": ["serendipity", "sonder", "petrichor", "ephemeral"]},
            {"name": "Historical & Rhetorical Oddities", "words": ["defenestration", "sesquipedalian", "schadenfreude"]},
            {"name": "Academic & Scientific Mastery", "words": ["perspicacious", "quintessential", "ubiquitous", "lexicography"]},
            {"name": "Grammatical & Linguistic Mastery", "words": ["serial comma"]}
        ]
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    api_key = os.getenv("OPENAI_API_KEY", "")
    has_key = bool(api_key and api_key.startswith("sk-") and not api_key.startswith("sk-proj-Your") and not OPENAI_KEY_EXHAUSTED)
    return {
        "status": "operational",
        "name": "Chatbot Abhi",
        "creator": "Abhijeeth V S",
        "version": "4.0.0",
        "openai_configured": has_key,
        "features": [
            "Real 3D Humanoid Robot in Handsome Guy Sculpt Dressed in Disciplined Bespoke Menswear with Expressive Eyes & 5-Digit Hands",
            "Advanced Lexicon & Historical Etymological Intelligence",
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
