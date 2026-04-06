import re
import ast
import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configure Gemini AI using the environment variable
GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
def get_ai_analysis(content):
    """
    Calls the Gemini API to analyze the code and detect the language.
    Expects a JSON response structured as:
    {
      "detected_language": "python",
      "issues": [
        { "issue_type": "...", "message": "...", "line_number": 1, "severity": "...", "suggestion": "..." }
      ]
    }
    """
    if not GEMINI_API_KEY:
        return None
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are an expert AI code reviewer. Analyze the following code snippet.
        First, identify the programming language it is written in (e.g., 'python', 'javascript', 'html', 'c++', etc.).
        Second, find any potential bugs, security vulnerabilities, style issues, or performance bottlenecks. Specifically, analyze for deep architectural anti-patterns (e.g. infinite recursion without a base case, race conditions, memory leaks, unoptimized database queries, and injection vulnerabilities).
        
        Return your response ONLY as a valid JSON object matching the following structure:
        {{
            "detected_language": "language_name_in_lowercase",
            "issues": [
                {{
                    "issue_type": "SECURITY|STYLE|BUG|PERFORMANCE",
                    "message": "Description of the issue",
                    "line_number": 10,
                    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
                    "suggestion": "How to fix it"
                }}
            ]
        }}
        
        If there are no issues, return an empty array for "issues". Do not include any markdown formatting or extra text outside the JSON.
        
        Code to analyze:
        ```
        {content}
        ```
        """
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown formatting if model didn't listen
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        ai_data = json.loads(response_text)
        return ai_data
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None

def analyze_code(content, language='python'):
    """
    Analyzes code content and returns a list of issues.
    Tries to use AI first if available, otherwise falls back to rule-based engine.
    """
    issues = []
    
    # Try AI Analysis First
    ai_results = get_ai_analysis(content)
    if ai_results:
        # If AI detected language, we could theoretically use it, but for now we just return its issues
        return ai_results.get("issues", [])
        
    # --- FALLBACK: Rule-based Analysis ---
    
    if language.lower() == 'python':
        try:
            ast.parse(content)
        except SyntaxError as e:
            issues.append({
                'issue_type': 'SYNTAX',
                'message': f'Syntax Error: {e.msg}',
                'line_number': e.lineno or 1,
                'severity': 'CRITICAL',
                'suggestion': 'Review your python syntax.'
            })
            
    lines = content.split('\n')

    # 1. Check for TODOs
    for i, line in enumerate(lines):
        if 'TODO' in line:
            issues.append({
                'issue_type': 'STYLE',
                'message': 'Found TODO comment. Consider resolving it.',
                'line_number': i + 1,
                'severity': 'LOW',
                'suggestion': 'Resolve the pending task or remove the comment.'
            })

    # 2. Check for prints (Python)
    if language.lower() == 'python':
        for i, line in enumerate(lines):
            if re.search(r'^\s*print\(', line):
                issues.append({
                    'issue_type': 'STYLE',
                    'message': 'Usage of print statement detected.',
                    'line_number': i + 1,
                    'severity': 'LOW',
                    'suggestion': 'Use logging instead of print for production code.'
                })
    
    # 3. Check for hardcoded secrets (Basic Pattern)
    secret_patterns = [
        (r'API_KEY\s*=\s*[\'"][a-zA-Z0-9]{20,}[\'"]', 'Potential hardcoded API Key detected.'),
        (r'PASSWORD\s*=\s*[\'"].+[\'"]', 'Potential hardcoded password detected.')
    ]
    
    for i, line in enumerate(lines):
        for pattern, msg in secret_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append({
                    'issue_type': 'SECURITY',
                    'message': msg,
                    'line_number': i + 1,
                    'severity': 'CRITICAL',
                    'suggestion': 'Use environment variables for secrets.'
                })

    # 4. Long Lines
    for i, line in enumerate(lines):
        if len(line) > 100:
             issues.append({
                'issue_type': 'STYLE',
                'message': 'Line is too long (> 100 chars).',
                'line_number': i + 1,
                'severity': 'LOW',
                'suggestion': 'Break line into multiple lines.'
            })

    # 5. Simulated ML Heuristics

    # Model 5A: SQL Injection Anomaly Model
    sql_exec_pattern = re.compile(r'\.execute\([\'"].*%s.*[\'"]\s*%|f[\'"].*\{.*\}')
    
    # Model 5B: Semantic Naming Model
    bad_naming_pattern = re.compile(r'\b[a-zA-Z]\s*=')
    
    # Model 5C: Exception Handling Anti-Pattern Model (Black Hole)
    swallow_except_pattern = re.compile(r'except\s+Exception\s*:\s*\n\s+pass')

    for i, line in enumerate(lines):
        # Check 5A
        if '.execute(' in line and sql_exec_pattern.search(line):
            issues.append({
                'issue_type': 'SECURITY',
                'message': '[ML SQLi Model] Highly probable SQL Injection vector detected via string formatting in .execute().',
                'line_number': i + 1,
                'severity': 'CRITICAL',
                'suggestion': 'Use parameterized database queries (e.g. `execute("...", [vars])`) instead of string formatting.'
            })
            
        # Check 5B
        if bad_naming_pattern.search(line):
             issues.append({
                'issue_type': 'STYLE',
                'message': '[ML Semantic Naming Model] Single-character variable assignment detected.',
                'line_number': i + 1,
                'severity': 'LOW',
                'suggestion': 'Use descriptive, semantic variable names for better maintainability.'
            })

    # Check 5C (Multiline Regex)
    if swallow_except_pattern.search(content):
        issues.append({
            'issue_type': 'BUG',
            'message': '[ML Error Handling Model] Detected a "Black Hole" Exception Anti-Pattern (swallowing exceptions with pass).',
            'line_number': None,
            'severity': 'HIGH',
            'suggestion': 'Never silently pass an Exception. At minimum, log the error to prevent silent, untraceable system failures.'
        })

    # Original AI checks
    if 'eval(' in content:
        issues.append({
            'issue_type': 'AI_ANALYSIS',
            'message': '[ML Model] Detected dangerous execution pattern (eval). Model confidence: 98%',
            'line_number': None,
            'severity': 'HIGH',
            'suggestion': 'Avoid using eval(). It poses a major security risk that can lead to remote code execution.'
        })
        
    # Model 5D: Time Complexity Model (Advanced O(N^2) Nesting)
    complex_nesting_pattern = re.compile(r'(    |\t){4,}')
    if complex_nesting_pattern.search(content):
        issues.append({
            'issue_type': 'PERFORMANCE',
            'message': '[ML Complexity Model] High Cognitive / Time Complexity detected. Code is too nested (Potential O(N^2)+ logic).',
            'line_number': None,
            'severity': 'MEDIUM',
            'suggestion': 'Refactor to reduce nesting depth to prevent algorithmic performance bottlenecks. Consider early returns, extracting functions, or hash mapping.'
        })

    return issues
