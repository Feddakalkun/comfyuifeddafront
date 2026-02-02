"""
Configure ComfyUI Manager settings for auto-installation
Sets security_level to 'weak' to allow all custom nodes to install
"""
import os
from pathlib import Path
import configparser

def setup_comfyui_manager_config():
    """Configure ComfyUI Manager to allow all custom nodes"""
    
    # Path to config.ini
    config_dir = Path(__file__).parent.parent / "ComfyUI" / "user" / "__manager"
    config_file = config_dir / "config.ini"
    
    # Create directory if it doesn't exist
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # Create or update config
    config = configparser.ConfigParser()
    
    # Load existing config if it exists
    if config_file.exists():
        config.read(config_file)
    
    # Ensure [default] section exists
    if 'default' not in config:
        config['default'] = {}
    
    # Set security_level to weak to allow all custom nodes
    config['default']['security_level'] = 'weak'
    
    # Set other useful defaults
    config['default']['preview_method'] = 'none'
    config['default']['file_logging'] = 'True'
    config['default']['component_policy'] = 'mine'
    config['default']['update_policy'] = 'stable-comfyui'
    config['default']['always_lazy_install'] = 'False'
    
    # Write config
    with open(config_file, 'w') as f:
        config.write(f)
    
    print(f"✅ ComfyUI Manager config updated: {config_file}")
    print("   Security level set to 'weak' - all custom nodes can be installed")

if __name__ == "__main__":
    setup_comfyui_manager_config()
