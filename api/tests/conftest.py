"""
Test configuration
"""
import os
import sys
from pathlib import Path

# Disable X-Ray tracing in tests
os.environ["POWERTOOLS_TRACE_DISABLED"] = "true"
os.environ["AWS_XRAY_CONTEXT_MISSING"] = "LOG_ERROR"

# Add src directory to Python path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))
