import re
import ast
import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def get_ai_analysis(content):
    """
    Deep AI analysis using Gemini. Returns issues, metrics, summary, and quality score.
    """
    if not GEMINI_API_KEY:
        return None

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are a SENIOR AI CODE SECURITY ARCHITECT with expertise across all programming languages.
Perform a thorough, multi-dimensional review of the following code.

YOUR ANALYSIS MUST COVER:
1. Language Detection
2. Security Vulnerabilities (OWASP Top 10: XSS, SQLi, IDOR, RCE, CSRF, etc.)
3. Bug Detection (logic errors, null pointer risks, race conditions, memory leaks)
4. Performance Bottlenecks (O(n²) loops, N+1 queries, blocking I/O, regex inefficiency)
5. Code Style & Maintainability (naming conventions, DRY violations, high complexity)
6. Best Practices (missing error handling, lack of input validation, no logging)
7. Dead Code & Unused Variables
8. Code Metrics (lines, functions, avg complexity)
9. Overall Code Quality Score out of 100

Return ONLY a valid JSON object with this EXACT structure (no markdown):
{{
    "detected_language": "python",
    "quality_score": 72,
    "summary": "Brief 2-sentence overall assessment of the code.",
    "metrics": {{
        "lines_of_code": 45,
        "num_functions": 3,
        "complexity_estimate": "Medium",
        "has_error_handling": true,
        "has_input_validation": false,
        "security_posture": "Weak"
    }},
    "issues": [
        {{
            "issue_type": "SECURITY|BUG|PERFORMANCE|STYLE|DEAD_CODE|BEST_PRACTICE",
            "message": "Clear, detailed description of the problem",
            "line_number": 12,
            "severity": "CRITICAL|HIGH|MEDIUM|LOW",
            "suggestion": "Specific, precise fix with code example if possible",
            "impact": "What happens if this is not fixed"
        }}
    ]
}}

Be exhaustive. Find at minimum 3-5 issues if they exist. If the code is perfect, return an empty issues array and a high quality_score.

Code to analyze:
```
{content}
```
"""
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Strip markdown fences if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        ai_data = json.loads(response_text.strip())
        return ai_data
    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None


def analyze_code(content, language='python'):
    """
    Analyzes code content using AI first, then falls back to rule-based engine.
    Returns a rich dict with issues, metrics, summary, and quality_score.
    """
    # --- PRIMARY: AI Analysis ---
    ai_results = get_ai_analysis(content)
    if ai_results:
        # Normalize issues to ensure 'impact' field exists
        for issue in ai_results.get("issues", []):
            issue.setdefault("impact", "")
        return ai_results

    # --- FALLBACK: Rule-based Analysis ---
    issues = []
    lines = content.split('\n')

    # Universal Checks
    for i, line in enumerate(lines):
        if re.search(r'(API_KEY|PASSWORD|SECRET|TOKEN)\s*=\s*[\'"][a-zA-Z0-9]{10,}[\'"]', line, re.IGNORECASE):
            issues.append({
                'issue_type': 'SECURITY', 'message': 'Hardcoded secret detected.',
                'line_number': i + 1, 'severity': 'CRITICAL',
                'suggestion': 'Use environment variables or a secrets manager.',
                'impact': 'Credentials can be exposed via source control or logs.'
            })
        if 'TODO' in line.upper():
            issues.append({
                'issue_type': 'BEST_PRACTICE', 'message': 'Pending TODO found.',
                'line_number': i + 1, 'severity': 'LOW',
                'suggestion': 'Track technical debt in an issue tracker.',
                'impact': 'Unresolved TODOs accumulate as technical debt.'
            })

    # Python Specific
    if language.lower() == 'python':
        try:
            ast.parse(content)
        except SyntaxError as e:
            issues.append({
                'issue_type': 'BUG', 'message': f'Syntax Error: {e.msg}',
                'line_number': e.lineno or 1, 'severity': 'CRITICAL',
                'suggestion': 'Fix the syntax error.', 'impact': 'Code will not execute.'
            })
        for i, line in enumerate(lines):
            if re.search(r'^\s*print\(', line):
                issues.append({'issue_type': 'STYLE', 'message': 'print() in production code.',
                               'line_number': i + 1, 'severity': 'LOW',
                               'suggestion': 'Use logging module.', 'impact': 'No observability control.'})
            if re.search(r'except\s*:', line):
                issues.append({'issue_type': 'BUG', 'message': 'Bare except clause.',
                               'line_number': i + 1, 'severity': 'MEDIUM',
                               'suggestion': 'Catch specific exceptions.',
                               'impact': 'Masks unexpected errors, making debugging impossible.'})

    # Compute simple metrics
    num_functions = len(re.findall(r'^\s*(def |function |func |public |private )', content, re.MULTILINE))
    metrics = {
        "lines_of_code": len(lines),
        "num_functions": num_functions,
        "complexity_estimate": "High" if len(lines) > 100 else "Medium" if len(lines) > 30 else "Low",
        "has_error_handling": bool(re.search(r'try|except|catch|error', content, re.IGNORECASE)),
        "has_input_validation": bool(re.search(r'validate|sanitize|strip|escape', content, re.IGNORECASE)),
        "security_posture": "Weak" if any(i['severity'] in ['CRITICAL', 'HIGH'] for i in issues) else "Moderate"
    }

    severity_weights = {'CRITICAL': 40, 'HIGH': 20, 'MEDIUM': 10, 'LOW': 5}
    penalty = sum(severity_weights.get(i['severity'], 0) for i in issues)
    quality_score = max(0, 100 - penalty)

    return {
        "detected_language": language,
        "quality_score": quality_score,
        "summary": f"Fallback analysis found {len(issues)} issue(s). AI analysis unavailable.",
        "metrics": metrics,
        "issues": issues
    }
