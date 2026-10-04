import pytest
from src.services.context import PersistentContextManager, filter_thinking_content

def test_context_manager_initialization():
    manager = PersistentContextManager()
    assert manager.is_initialized is False
    assert len(manager.conversation_history) == 0

def test_context_manager_onboarding():
    manager = PersistentContextManager()
    onboarding_data = {
        'name': 'Alice',
        'company': 'Google',
        'role': 'Senior Engineer',
        'resume': '10 years of Python',
        'objectives': 'Build scalable AI systems',
        'focus': ['coding', 'system-design']
    }
    
    manager.initialize_persistent_context(onboarding_data)
    
    assert manager.is_initialized is True
    assert manager.persistent_context['candidate_name'] == 'Alice'
    assert manager.persistent_context['target_company'] == 'Google'
    assert manager.persistent_context['focus_areas'] == ['coding', 'system-design']

def test_add_conversation_exchange():
    manager = PersistentContextManager()
    
    # Simulate a few exchanges
    manager.add_conversation_exchange(interviewer_question="How does React work?", ai_response="React uses a virtual DOM.")
    manager.add_conversation_exchange(interviewer_question=None, candidate_response="I think it uses a virtual DOM.")
    
    assert len(manager.conversation_history) == 1
    assert manager.conversation_history[-1]['interviewer_question'] == "How does React work?"
    assert manager.conversation_history[-1]['candidate_response'] == "I think it uses a virtual DOM."
    assert manager.conversation_history[-1]['ai_response'] == "React uses a virtual DOM."

def test_filter_thinking_content():
    # Test text without think tags (fast-path)
    normal_text = "This is a normal AI response."
    assert filter_thinking_content(normal_text) == normal_text

    # Test text with <think> tags
    thinking_text = "<think>Let me analyze this question...</think>Here is the actual answer."
    assert filter_thinking_content(thinking_text) == "Here is the actual answer."

    # Test text with mixed-case <THinK> tags
    mixed_thinking_text = "<THinK>Analyzing mixed case...</THinK>Here is the answer."
    assert filter_thinking_content(mixed_thinking_text) == "Here is the answer."

    # Test edge cases
    assert filter_thinking_content(None) is None
    assert filter_thinking_content("") == ""
