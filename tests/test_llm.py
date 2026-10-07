import pytest
from src.services.llm import LLMManager
from src.services.vision import VisionManager

def test_llm_manager_client_caching_and_rotation():
    api_keys = ["key_1", "key_2", "key_3"]
    manager = LLMManager(
        provider_name="TestProvider",
        base_url="https://api.test.com/v1",
        api_key="key_1",
        model_name="test-model",
        api_keys=api_keys
    )

    # Verify all clients were cached
    assert len(manager.clients) == 3
    assert manager.client is manager.clients[0]
    first_client = manager.clients[0]
    second_client = manager.clients[1]
    third_client = manager.clients[2]

    assert first_client is not second_client
    assert second_client is not third_client

    # Verify key rotation reuses existing cached client instances
    manager._rotate_key()
    assert manager._key_index == 1
    assert manager.api_key == "key_2"
    assert manager.client is second_client

    manager._rotate_key()
    assert manager._key_index == 2
    assert manager.api_key == "key_3"
    assert manager.client is third_client

    manager._rotate_key()
    assert manager._key_index == 0
    assert manager.api_key == "key_1"
    assert manager.client is first_client


def test_vision_manager_client_caching_and_rotation():
    api_keys = ["vision_key_1", "vision_key_2"]
    manager = VisionManager(
        provider_name="TestVisionProvider",
        base_url="https://api.vision.com/v1",
        api_key="vision_key_1",
        model_name="vision-model",
        api_keys=api_keys
    )

    # Verify all vision clients were cached
    assert len(manager.clients) == 2
    assert manager.client is manager.clients[0]
    client_0 = manager.clients[0]
    client_1 = manager.clients[1]

    # Verify key rotation reuses cached vision clients
    manager._rotate_key()
    assert manager._key_index == 1
    assert manager.api_key == "vision_key_2"
    assert manager.client is client_1

    manager._rotate_key()
    assert manager._key_index == 0
    assert manager.api_key == "vision_key_1"
    assert manager.client is client_0
