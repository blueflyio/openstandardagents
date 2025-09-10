"""
LangChain integration for OSSA Validation Specialist Agent
Provides OSSA v0.1.8 validation tools for LangChain workflows
"""

from typing import Dict, List, Optional, Any
import json
import yaml
import requests
from langchain.tools import BaseTool
from langchain.callbacks.manager import CallbackManagerForToolUse
from pydantic import BaseModel, Field


class OSSAValidationTool(BaseTool):
    """LangChain tool for OSSA specification validation"""
    
    name = "ossa_validate"
    description = "Validate OpenAPI AI Agents Standard (OSSA) v0.1.8 specifications"
    
    validation_api_url: str = Field(default="http://localhost:3003/api/v1")
    api_key: Optional[str] = Field(default=None)
    
    def _run(
        self,
        specification: str,
        validation_type: str = "openapi",
        run_manager: Optional[CallbackManagerForToolUse] = None,
    ) -> str:
        """Execute OSSA validation"""
        try:
            # Parse specification
            if validation_type == "yaml":
                spec_data = yaml.safe_load(specification)
            else:
                spec_data = json.loads(specification)
            
            # Prepare validation request
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            
            endpoint = f"{self.validation_api_url}/validate/openapi"
            payload = {
                "specification": spec_data,
                "validation_level": "standard",
                "target_certification": "silver"
            }
            
            # Call validation API
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            # Format result for LangChain
            if result.get("valid", False):
                certification = result.get("certification_level", "none")
                passed = result.get("passed", 0)
                warnings = result.get("warnings", 0)
                
                return f"✅ OSSA Validation PASSED\nCertification: {certification.upper()}\nChecks Passed: {passed}\nWarnings: {warnings}"
            else:
                errors = result.get("errors", [])
                error_summary = "\n".join([f"- {err.get('message', str(err))}" for err in errors[:5]])
                return f"❌ OSSA Validation FAILED\nErrors:\n{error_summary}"
                
        except Exception as e:
            return f"❌ Validation Error: {str(e)}"

    async def _arun(
        self,
        specification: str,
        validation_type: str = "openapi",
        run_manager: Optional[CallbackManagerForToolUse] = None,
    ) -> str:
        """Async version of _run"""
        # For now, use sync version
        return self._run(specification, validation_type, run_manager)


class OSSADualFormatTool(BaseTool):
    """LangChain tool for OSSA dual-format validation"""
    
    name = "ossa_dual_validate"
    description = "Validate both agent.yml and openapi.yaml files for OSSA compliance"
    
    validation_api_url: str = Field(default="http://localhost:3003/api/v1")
    api_key: Optional[str] = Field(default=None)
    
    def _run(
        self,
        agent_config: str,
        openapi_spec: str,
        run_manager: Optional[CallbackManagerForToolUse] = None,
    ) -> str:
        """Execute dual-format validation"""
        try:
            # Parse configurations
            agent_data = yaml.safe_load(agent_config)
            openapi_data = yaml.safe_load(openapi_spec)
            
            # Prepare validation request
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            
            endpoint = f"{self.validation_api_url}/validate/dual-format"
            payload = {
                "agent_config": agent_data,
                "openapi_spec": openapi_data
            }
            
            # Call validation API
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            # Format comprehensive result
            if result.get("valid", False):
                cert_level = result.get("certification_level", "none")
                passed = result.get("passed", 0)
                warnings = result.get("warnings", 0)
                
                consistency_checks = result.get("details", {}).get("consistency_checks", {})
                framework_support = result.get("details", {}).get("framework_support", {})
                
                return f"""✅ OSSA Dual-Format Validation PASSED
Certification Level: {cert_level.upper()}
Checks Passed: {passed}
Warnings: {warnings}

Consistency Validation:
- Capability Mapping: {'✅' if consistency_checks.get('capabilities', False) else '❌'}
- Security Alignment: {'✅' if consistency_checks.get('security', False) else '❌'}
- Protocol Support: {'✅' if consistency_checks.get('protocols', False) else '❌'}

Framework Support:
- LangChain: {'✅' if framework_support.get('langchain', False) else '❌'}
- CrewAI: {'✅' if framework_support.get('crewai', False) else '❌'}
- MCP: {'✅' if framework_support.get('mcp', False) else '❌'}"""
                
            else:
                errors = result.get("errors", [])
                error_summary = "\n".join([f"- {err.get('message', str(err))}" for err in errors[:5]])
                return f"❌ OSSA Dual-Format Validation FAILED\nErrors:\n{error_summary}"
                
        except Exception as e:
            return f"❌ Dual-Format Validation Error: {str(e)}"


class OSSAComplianceChecker:
    """LangChain-compatible compliance checker for OSSA agents"""
    
    def __init__(self, api_url: str = "http://localhost:3003/api/v1", api_key: Optional[str] = None):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["X-API-Key"] = api_key
    
    def validate_agent_spec(self, agent_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Validate agent specification for OSSA compliance"""
        try:
            endpoint = f"{self.api_url}/validate/openapi"
            payload = {
                "specification": agent_spec,
                "validation_level": "strict",
                "target_certification": "gold"
            }
            
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def get_compliance_status(self) -> Dict[str, Any]:
        """Get overall compliance status"""
        try:
            endpoint = f"{self.api_url}/capabilities"
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            return {"error": str(e)}


# LangChain Agent Integration Example
class OSSAValidationAgent:
    """LangChain agent with OSSA validation capabilities"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.validation_tool = OSSAValidationTool(api_key=api_key)
        self.dual_format_tool = OSSADualFormatTool(api_key=api_key)
        self.compliance_checker = OSSAComplianceChecker(api_key=api_key)
    
    def get_langchain_tools(self) -> List[BaseTool]:
        """Get list of OSSA tools for LangChain agent"""
        return [self.validation_tool, self.dual_format_tool]
    
    def validate_workflow_agents(self, agent_specs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate multiple agents in a LangChain workflow"""
        results = []
        for spec in agent_specs:
            result = self.compliance_checker.validate_agent_spec(spec)
            results.append({
                "agent_name": spec.get("info", {}).get("title", "unknown"),
                "valid": result.get("valid", False),
                "certification_level": result.get("certification_level", "none"),
                "errors": result.get("errors", [])
            })
        return results


# Example usage with LangChain
if __name__ == "__main__":
    # Initialize OSSA validation agent
    ossa_agent = OSSAValidationAgent(api_key="your-api-key")
    
    # Get tools for LangChain
    tools = ossa_agent.get_langchain_tools()
    
    # Example OpenAPI spec validation
    sample_spec = """
    {
        "openapi": "3.1.0",
        "info": {
            "title": "Test Agent",
            "version": "1.0.0",
            "x-openapi-ai-agents-standard": {
                "version": "0.1.8"
            }
        }
    }
    """
    
    # Validate using the tool
    result = tools[0]._run(sample_spec)
    print(result)