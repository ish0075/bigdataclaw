"""
Text-to-Speech Service
Uses browser-compatible audio generation
"""

import os
import hashlib
import asyncio
from typing import Optional
from pathlib import Path
import aiohttp

# Try to import TTS libraries
try:
    from TTS.api import TTS
    COQUI_AVAILABLE = True
except ImportError:
    COQUI_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False


class TTSService:
    """
    Text-to-Speech service with multiple backend options:
    1. Coqui TTS (open source, high quality)
    2. pyttsx3 (offline, fast)
    3. gTTS (Google Text-to-Speech)
    4. Browser TTS (frontend fallback)
    """
    
    def __init__(self, output_dir: str = "./audio_output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.coqui_tts = None
        self.pyttsx3_engine = None
        
        # Initialize best available TTS engine
        self._init_engine()
        
        # Voice mappings for different agents
        self.voice_mappings = {
            "alex": {"gender": "male", "pitch": 1.0, "speed": 1.0},
            "sam": {"gender": "female", "pitch": 1.1, "speed": 0.95},
            "jordan": {"gender": "male", "pitch": 0.9, "speed": 1.0, "accent": "british"},
            "taylor": {"gender": "female", "pitch": 1.2, "speed": 1.05},
        }
    
    def _init_engine(self):
        """Initialize the best available TTS engine"""
        if COQUI_AVAILABLE:
            try:
                self.coqui_tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ Coqui TTS initialized")
                return
            except Exception as e:
                print(f"⚠️ Coqui TTS failed: {e}")
        
        if PYTTSX3_AVAILABLE:
            try:
                self.pyttsx3_engine = pyttsx3.init()
                print("✅ pyttsx3 initialized")
            except Exception as e:
                print(f"⚠️ pyttsx3 failed: {e}")
    
    def _generate_filename(self, text: str, voice_id: str) -> str:
        """Generate unique filename based on text hash"""
        text_hash = hashlib.md5(f"{text}:{voice_id}".encode()).hexdigest()[:12]
        return f"{voice_id}_{text_hash}.mp3"
    
    async def synthesize(
        self, 
        text: str, 
        voice_id: str = "alex",
        speed: float = 1.0
    ) -> dict:
        """
        Synthesize text to speech
        
        Returns:
            dict with audio_url, duration_seconds, voice_id
        """
        filename = self._generate_filename(text, voice_id)
        output_path = self.output_dir / filename
        
        # Use cached file if exists
        if output_path.exists():
            return {
                "audio_url": f"/audio/{filename}",
                "duration_seconds": self._estimate_duration(text, speed),
                "voice_id": voice_id,
                "text_hash": hashlib.md5(text.encode()).hexdigest()[:12],
                "cached": True
            }
        
        # Try gTTS first (lightweight, no ML models needed)
        try:
            await self._synthesize_gtts(text, output_path, voice_id)
            return {
                "audio_url": f"/audio/{filename}",
                "duration_seconds": self._estimate_duration(text, speed),
                "voice_id": voice_id,
                "cached": False
            }
        except Exception as e:
            print(f"gTTS failed: {e}, trying fallback...")
        
        # Fallback to pyttsx3
        if PYTTSX3_AVAILABLE and self.pyttsx3_engine:
            try:
                await self._synthesize_pyttsx3(text, output_path, voice_id)
                return {
                    "audio_url": f"/audio/{filename}",
                    "duration_seconds": self._estimate_duration(text, speed),
                    "voice_id": voice_id,
                    "cached": False
                }
            except Exception as e:
                print(f"pyttsx3 failed: {e}")
        
        # Final fallback: return text for browser TTS
        return {
            "audio_url": None,
            "duration_seconds": self._estimate_duration(text, speed),
            "voice_id": voice_id,
            "text": text,
            "use_browser_tts": True
        }
    
    async def _synthesize_gtts(self, text: str, output_path: Path, voice_id: str):
        """Synthesize using gTTS (Google Text-to-Speech)"""
        try:
            from gtts import gTTS
            
            # Map voice_id to language/accent
            lang = "en"
            tld = "com"
            
            if voice_id == "jordan":
                tld = "co.uk"  # British accent
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: gTTS(text=text, lang=lang, tld=tld, slow=False).save(str(output_path))
            )
        except ImportError:
            raise ImportError("gTTS not installed")
    
    async def _synthesize_pyttsx3(self, text: str, output_path: Path, voice_id: str):
        """Synthesize using pyttsx3"""
        def _speak():
            voice_config = self.voice_mappings.get(voice_id, {})
            
            # Set voice properties
            voices = self.pyttsx3_engine.getProperty('voices')
            
            # Try to match gender
            gender = voice_config.get("gender", "male")
            for voice in voices:
                if gender == "female" and "female" in voice.name.lower():
                    self.pyttsx3_engine.setProperty('voice', voice.id)
                    break
                elif gender == "male" and "male" in voice.name.lower():
                    self.pyttsx3_engine.setProperty('voice', voice.id)
                    break
            
            # Set rate
            rate = voice_config.get("speed", 1.0)
            self.pyttsx3_engine.setProperty('rate', int(200 * rate))
            
            self.pyttsx3_engine.save_to_file(text, str(output_path))
            self.pyttsx3_engine.runAndWait()
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _speak)
    
    def _estimate_duration(self, text: str, speed: float) -> float:
        """Estimate audio duration based on word count"""
        words = len(text.split())
        # Average speaking rate: 150 words per minute
        duration = (words / 150) * 60 / speed
        return round(duration, 2)
    
    async def health_check(self) -> dict:
        """Check TTS service health"""
        return {
            "coqui_available": COQUI_AVAILABLE and self.coqui_tts is not None,
            "pyttsx3_available": PYTTSX3_AVAILABLE and self.pyttsx3_engine is not None,
            "output_dir": str(self.output_dir.absolute()),
            "cached_files": len(list(self.output_dir.glob("*.mp3"))),
            "browser_tts_fallback": True
        }


# Singleton instance
tts_service = TTSService()


async def test_tts():
    """Test the TTS service"""
    print("Testing TTS Service...")
    
    # Health check
    health = await tts_service.health_check()
    print(f"Health: {health}")
    
    # Test synthesis
    test_text = "Hello, I am Alex, the recruiting specialist. Let's find some great agents today."
    result = await tts_service.synthesize(test_text, "alex")
    print(f"Synthesized: {result}")


if __name__ == "__main__":
    asyncio.run(test_tts())
