
import sys

def check_nesting(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    brace_level = 0
    paren_level = 0
    in_string = False
    string_char = ''
    in_comment = False
    
    for i, char in enumerate(content):
        if in_comment:
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
            continue
        
        if not in_string:
            if char == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_comment = True
                continue
            if char == '/' and i + 1 < len(content) and content[i+1] == '/':
                # Skip to end of line
                j = i
                while j < len(content) and content[j] != '\n':
                    j += 1
                # (simplification, doesn't handle all cases but good enough for this)
                continue
        
        if char in ["'", '"', '`']:
            if not in_string:
                in_string = True
                string_char = char
            elif string_char == char:
                in_string = False
            continue
        
        if not in_string:
            if char == '{':
                brace_level += 1
            elif char == '}':
                brace_level -= 1
            elif char == '(':
                paren_level += 1
            elif char == ')':
                paren_level -= 1
            
            if brace_level < 0 or paren_level < 0:
                line = content.count('\n', 0, i) + 1
                col = i - content.rfind('\n', 0, i)
                print(f"Negative level at line {line}, col {col}: brace={brace_level}, paren={paren_level}")
                return
                
    print(f"Final levels: brace={brace_level}, paren={paren_level}")

if __name__ == "__main__":
    check_nesting(sys.argv[1])
