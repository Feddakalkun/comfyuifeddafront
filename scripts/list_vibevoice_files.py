"""
List all files in VibeVoice HuggingFace repo
"""
from huggingface_hub import list_repo_files

repo_id = "microsoft/VibeVoice-1.5B"

print(f"📁 Listing files in {repo_id}...\n")

try:
    files = list_repo_files(repo_id)
    
    print(f"Found {len(files)} files:\n")
    for file in sorted(files):
        print(f"  - {file}")
        
except Exception as e:
    print(f"Error: {e}")
    print("\nAlternatively, install huggingface_hub:")
    print("pip install huggingface_hub")
