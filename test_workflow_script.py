import urllib.request
import urllib.parse
import json

workflow_json_path = r"H:\FeddaUI-claude\comfyuifeddafrontclean\frontend\public\workflows\LTX2lipsyncv2.json"
with open(workflow_json_path, 'r', encoding='utf-8') as f:
    prompt = json.load(f)

# Need to set client_id
data = json.dumps({"prompt": prompt}).encode('utf-8')
req =  urllib.request.Request("http://127.0.0.1:8188/prompt", data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print("Workflow queued successfully! Prompt ID:", result['prompt_id'])
except Exception as e:
    print("Error queuing workflow:", e)
