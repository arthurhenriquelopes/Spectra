import pytest
from src.services.context import PersistentContextManager

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
