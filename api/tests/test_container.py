"""
Unit tests for dependency injection container
"""
import os

import pytest

# Set environment variable for tests
os.environ['DYNAMODB_TABLE_NAME'] = 'test-table'


class TestContainer:
    """Tests for Container class"""
    
    def test_register_and_resolve_singleton(self):
        """Test registering and resolving a singleton service"""
        from src.container import Container
        
        class TestService:
            def __init__(self, value: str):
                self.value = value
        
        container = Container()
        container.register(TestService, lambda: TestService("test"), singleton=True)
        
        # Resolve twice, should get same instance
        instance1 = container.resolve(TestService)
        instance2 = container.resolve(TestService)
        
        assert instance1 is instance2
        assert instance1.value == "test"
    
    def test_register_and_resolve_transient(self):
        """Test registering and resolving a transient service"""
        from src.container import Container
        
        class TestService:
            def __init__(self, value: str):
                self.value = value
        
        container = Container()
        container.register(TestService, lambda: TestService("test"), singleton=False)
        
        # Resolve twice, should get different instances
        instance1 = container.resolve(TestService)
        instance2 = container.resolve(TestService)
        
        assert instance1 is not instance2
        assert instance1.value == "test"
        assert instance2.value == "test"
    
    def test_register_instance(self):
        """Test registering an existing instance"""
        from src.container import Container
        
        class TestService:
            def __init__(self, value: str):
                self.value = value
        
        container = Container()
        instance = TestService("test")
        container.register_instance(TestService, instance)
        
        resolved = container.resolve(TestService)
        assert resolved is instance
    
    def test_resolve_unregistered(self):
        """Test resolving an unregistered service"""
        from src.container import Container
        
        class TestService:
            pass
        
        container = Container()
        
        with pytest.raises(ValueError, match="No factory registered"):
            container.resolve(TestService)
    
    def test_clear(self):
        """Test clearing the container"""
        from src.container import Container
        
        class TestService:
            pass
        
        container = Container()
        container.register(TestService, lambda: TestService(), singleton=True)
        
        # Resolve to create singleton
        container.resolve(TestService)
        
        # Clear and try to resolve again
        container.clear()
        
        with pytest.raises(ValueError):
            container.resolve(TestService)


class TestGlobalContainer:
    """Tests for global container functions"""
    
    def test_get_container(self):
        """Test getting the global container"""
        from src.container import get_container, reset_container
        
        reset_container()
        
        container1 = get_container()
        container2 = get_container()
        
        # Should return same instance
        assert container1 is container2
    
    def test_reset_container(self):
        """Test resetting the global container"""
        from src.container import get_container, reset_container
        
        container1 = get_container()
        reset_container()
        container2 = get_container()
        
        # Should return different instances
        assert container1 is not container2
    
    def test_container_with_manual_registration(self):
        """Test container with manual service registration"""
        from src.container import Container
        
        class MockRepository:
            pass
        
        class MockService:
            def __init__(self, repo):
                self.repository = repo
        
        container = Container()
        
        # Register mock services
        container.register(MockRepository, lambda: MockRepository(), singleton=True)
        container.register(
            MockService,
            lambda: MockService(container.resolve(MockRepository)),
            singleton=True
        )
        
        # Resolve and verify
        service = container.resolve(MockService)
        assert service is not None
        assert service.repository is not None
        
        # Verify singleton behavior
        service2 = container.resolve(MockService)
        assert service is service2
