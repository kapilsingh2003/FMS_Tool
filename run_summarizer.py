import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from summarizer import summarizeDifferences

if __name__ == '__main__':
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        result = summarizeDifferences(
            data['fmsKey'],
            data['fmsKeyDescription'],
            data['jsonData']
        )
        print(json.dumps({'success': True, 'summary': result}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
