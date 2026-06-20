#!/usr/bin/env python3
"""
Setup script for Coreed CLI

Install with: pip install -e .
"""

from setuptools import setup, find_packages

with open("requirements.txt", "r") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="coreed-cli-v3",
    version="3.0.0",
    description="Push to Coreed - Deploy AI models and agents to Coreed on 0G Chain",
    author="Coreed Team",
    author_email="team@coreed.ai",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "push-to-coreed = cli.coreed_cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
