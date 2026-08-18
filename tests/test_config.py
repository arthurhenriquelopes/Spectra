import pytest
from src.config.settings import Settings

def test_settings_initialization():
    # Test if settings can be instantiated and default values are reasonable
    settings = Settings()
    
    assert settings.LOG_LEVEL in ["DEBUG", "INFO", "WARNING", "ERROR"]
    assert type(settings.DEV_MODE) is bool
    assert type(settings.MAX_CONVERSATION_HISTORY) is int

def test_settings_override():
    # Test if we can override via init
    custom_settings = Settings(DEV_MODE=True, MAX_CONVERSATION_HISTORY=10)
    assert custom_settings.DEV_MODE is True
    assert custom_settings.MAX_CONVERSATION_HISTORY == 10
