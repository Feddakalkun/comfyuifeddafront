import numpy as np
import scipy.io.wavfile as wav
import os

# Create a more speech-like signal (harmonics) instead of pure sine
def create_reference_audio():
    sample_rate = 24000
    duration = 5.0 # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Fundamental query at 120Hz (male-ish)
    f0 = 120
    signal = 0.5 * np.sin(2 * np.pi * f0 * t)
    
    # Add harmonics to sound more like a "voice" and less like a "beep"
    for i in range(2, 6):
        signal += (0.5 / i) * np.sin(2 * np.pi * f0 * i * t)
        
    # Normalized
    signal = signal / np.max(np.abs(signal))
    
    # Convert to 16-bit PCM
    audio_data = (signal * 32767).astype(np.int16)
    
    path = r"H:\comfyfront\ComfyUI\input\reference_voice.wav"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wav.write(path, sample_rate, audio_data)
    print(f"Created reference audio at: {path}")

if __name__ == "__main__":
    create_reference_audio()
