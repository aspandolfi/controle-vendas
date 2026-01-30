"""
Dependency Injection Container
"""
import os
from typing import Any, Callable, Dict, Optional, Type, TypeVar

from repository import DynamoDBRepository
from service import CustomerService, PaymentService, SaleService

T = TypeVar('T')


class Container:
    """Simple dependency injection container"""
    
    def __init__(self):
        self._services: Dict[Type, Any] = {}
        self._factories: Dict[Type, Callable] = {}
        self._singletons: Dict[Type, Any] = {}
    
    def register(self, interface: Type[T], factory: Callable[[], T], singleton: bool = True) -> None:
        """
        Register a service factory
        
        Args:
            interface: The interface/class type
            factory: Factory function that creates the instance
            singleton: If True, only one instance is created and reused
        """
        self._factories[interface] = factory
        if singleton:
            self._singletons[interface] = None
    
    def register_instance(self, interface: Type[T], instance: T) -> None:
        """
        Register an existing instance
        
        Args:
            interface: The interface/class type
            instance: The instance to register
        """
        self._services[interface] = instance
    
    def resolve(self, interface: Type[T]) -> T:
        """
        Resolve and return an instance of the requested type
        
        Args:
            interface: The interface/class type to resolve
            
        Returns:
            Instance of the requested type
            
        Raises:
            ValueError: If the type is not registered
        """
        # Check if instance is already registered
        if interface in self._services:
            return self._services[interface]
        
        # Check if it's a singleton and already created
        if interface in self._singletons:
            if self._singletons[interface] is not None:
                return self._singletons[interface]
        
        # Check if there's a factory
        if interface not in self._factories:
            raise ValueError(f"No factory registered for {interface}")
        
        # Create instance using factory
        instance = self._factories[interface]()
        
        # Store singleton if needed
        if interface in self._singletons:
            self._singletons[interface] = instance
        
        return instance
    
    def clear(self) -> None:
        """Clear all registrations (useful for testing)"""
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()


# Global container instance
_container: Optional[Container] = None


def get_container() -> Container:
    """
    Get or create the global container instance
    
    Returns:
        Container instance
    """
    global _container
    if _container is None:
        _container = Container()
        _configure_container(_container)
    return _container


def _configure_container(container: Container) -> None:
    """
    Configure the dependency injection container with all services
    
    Args:
        container: Container to configure
    """
    # Get table name from environment (support both variables)
    table_name = os.environ.get('TABLE_NAME') or os.environ.get('DYNAMODB_TABLE_NAME', 'controle-vendas')
    
    # Register repository
    container.register(
        DynamoDBRepository,
        lambda: DynamoDBRepository(table_name),
        singleton=True
    )
    
    # Register CustomerService
    container.register(
        CustomerService,
        lambda: CustomerService(container.resolve(DynamoDBRepository)),
        singleton=True
    )
    
    # Register SaleService
    container.register(
        SaleService,
        lambda: SaleService(container.resolve(DynamoDBRepository)),
        singleton=True
    )
    
    # Register PaymentService (depends on SaleService)
    container.register(
        PaymentService,
        lambda: PaymentService(
            container.resolve(DynamoDBRepository),
            container.resolve(SaleService)
        ),
        singleton=True
    )


def reset_container() -> None:
    """Reset the global container (useful for testing)"""
    global _container
    _container = None
