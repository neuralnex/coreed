"""
Coreed CLI - Push to Coreed with git workflow integration

This package provides a `push_to_coreed` function and CLI that mirrors
Hugging Face's `push_to_hub` functionality, enabling seamless deployment
of AI models and agents to Coreed on 0G Chain.

Features:
- Git workflow integration (like Hugging Face Spaces)
- Automatic model upload to 0G Storage
- Automatic registration to ModelRegistry
- Space deployment to 0G Compute
- Environment variable management
- Health check integration
"""

from .coreed_cli import (
    push_to_coreed,
    deploy_space,
    download_model_from_storage,
    upload_model_to_storage,
    register_model,
    create_space_config,
    validate_environment,
)

__version__ = "1.0.0"
__all__ = [
    "push_to_coreed",
    "deploy_space",
    "download_model_from_storage",
    "upload_model_to_storage",
    "register_model",
    "create_space_config",
    "validate_environment",
]
