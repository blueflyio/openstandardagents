#!/usr/bin/env python3
"""
OSSA Agent-Architect Task Handlers
Specialized task execution for API, industrial protocols, and GitLab integration
"""

import asyncio
import json
import yaml
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import aiohttp
import git
from urllib.parse import urlparse

class TaskType(Enum):
    API_SPECIFICATION_RESEARCH = "api_spec_research"
    INDUSTRIAL_PROTOCOL_ANALYSIS = "industrial_protocol_analysis"
    GITLAB_PIPELINE_INTEGRATION = "gitlab_pipeline_integration"
    PROJECT_ANALYSIS = "project_analysis"
    TRAINING_DATA_GENERATION = "training_data_generation"

@dataclass
class TaskResult:
    task_id: str
    task_type: TaskType
    status: str
    outputs: Dict[str, Any]
    metadata: Dict[str, Any]
    artifacts: List[str]

class APISpecificationHandler:
    """Handler for OpenAPI 3.1 specification research and generation"""
    
    async def research_and_generate_spec(
        self, 
        topic: str, 
        requirements: Dict[str, Any]
    ) -> TaskResult:
        """
        Research topic and generate OpenAPI 3.1 specification
        """
        task_id = f"api_spec_{topic.replace(' ', '_')}"
        
        steps = [
            self._analyze_domain_requirements,
            self._research_existing_standards,  
            self._design_resource_model,
            self._define_security_scheme,
            self._generate_openapi_yaml,
            self._validate_with_spectral,
            self._generate_documentation,
            self._create_gitlab_pipeline
        ]
        
        outputs = {}
        artifacts = []
        
        try:
            for step in steps:
                result = await step(topic, requirements)
                outputs.update(result.get('outputs', {}))
                artifacts.extend(result.get('artifacts', []))
                
            return TaskResult(
                task_id=task_id,
                task_type=TaskType.API_SPECIFICATION_RESEARCH,
                status="completed",
                outputs=outputs,
                metadata={
                    "openapi_version": "3.1.0",
                    "validation_passed": True,
                    "security_schemes": outputs.get('security_schemes', []),
                    "endpoints_count": outputs.get('endpoints_count', 0)
                },
                artifacts=artifacts
            )
            
        except Exception as e:
            return TaskResult(
                task_id=task_id,
                task_type=TaskType.API_SPECIFICATION_RESEARCH,
                status="failed",
                outputs={"error": str(e)},
                metadata={},
                artifacts=[]
            )
    
    async def _analyze_domain_requirements(self, topic: str, requirements: Dict) -> Dict:
        """Analyze domain-specific requirements for API design"""
        domain_analysis = {
            "resource_entities": [],
            "operation_patterns": [],
            "data_relationships": [],
            "security_requirements": []
        }
        
        # Extract entities from requirements
        if 'entities' in requirements:
            domain_analysis['resource_entities'] = requirements['entities']
        
        # Determine REST patterns based on operations
        if 'operations' in requirements:
            for op in requirements['operations']:
                if op in ['create', 'read', 'update', 'delete']:
                    domain_analysis['operation_patterns'].append(f"CRUD_{op}")
                elif op in ['search', 'filter', 'sort']:
                    domain_analysis['operation_patterns'].append(f"QUERY_{op}")
        
        return {"outputs": domain_analysis}
    
    async def _research_existing_standards(self, topic: str, requirements: Dict) -> Dict:
        """Research existing standards and specifications"""
        standards_research = {
            "related_specs": [],
            "industry_patterns": [],
            "compliance_requirements": []
        }
        
        # Research OpenAPI examples from official sources
        official_sources = [
            "https://spec.openapis.org/oas/v3.1.0",
            "https://github.com/OAI/OpenAPI-Specification/tree/main/examples"
        ]
        
        async with aiohttp.ClientSession() as session:
            for source in official_sources:
                try:
                    async with session.get(source) as response:
                        if response.status == 200:
                            content = await response.text()
                            standards_research['related_specs'].append({
                                "source": source,
                                "content_type": response.headers.get('content-type'),
                                "size": len(content)
                            })
                except Exception as e:
                    print(f"Failed to fetch {source}: {e}")
        
        return {"outputs": standards_research}
    
    async def _generate_openapi_yaml(self, topic: str, requirements: Dict) -> Dict:
        """Generate OpenAPI 3.1 YAML specification"""
        
        spec = {
            "openapi": "3.1.0",
            "info": {
                "title": f"{topic.title()} API",
                "version": "1.0.0",
                "description": f"OpenAPI 3.1 specification for {topic}",
                "summary": f"Comprehensive API for {topic} operations"
            },
            "servers": [
                {
                    "url": "https://api.example.com/v1",
                    "description": "Production server"
                }
            ],
            "paths": {},
            "components": {
                "schemas": {},
                "securitySchemes": {
                    "ApiKeyAuth": {
                        "type": "apiKey",
                        "in": "header",
                        "name": "X-API-Key"
                    },
                    "OAuth2": {
                        "type": "oauth2",
                        "flows": {
                            "authorizationCode": {
                                "authorizationUrl": "https://auth.example.com/oauth/authorize",
                                "tokenUrl": "https://auth.example.com/oauth/token",
                                "scopes": {
                                    "read": "Read access",
                                    "write": "Write access"
                                }
                            }
                        }
                    }
                }
            },
            "security": [
                {"ApiKeyAuth": []},
                {"OAuth2": ["read", "write"]}
            ]
        }
        
        # Save to file
        spec_path = Path(f"openapi-{topic.replace(' ', '-')}.yaml")
        with open(spec_path, 'w') as f:
            yaml.dump(spec, f, default_flow_style=False)
        
        return {
            "outputs": {
                "spec_file": str(spec_path),
                "endpoints_count": len(spec['paths']),
                "security_schemes": list(spec['components']['securitySchemes'].keys())
            },
            "artifacts": [str(spec_path)]
        }

class IndustrialProtocolHandler:
    """Handler for OPC UA and UADP protocol analysis"""
    
    async def analyze_protocol(
        self, 
        protocol_type: str, 
        use_case: Dict[str, Any]
    ) -> TaskResult:
        """
        Analyze and implement industrial protocol solution
        """
        task_id = f"protocol_{protocol_type}_{use_case.get('name', 'analysis')}"
        
        analysis = await self._comprehensive_protocol_analysis(protocol_type, use_case)
        
        return TaskResult(
            task_id=task_id,
            task_type=TaskType.INDUSTRIAL_PROTOCOL_ANALYSIS,
            status="completed",
            outputs=analysis,
            metadata={
                "protocol": protocol_type,
                "transport_layer": analysis.get("transport", "udp"),
                "security_level": analysis.get("security_level", "none"),
                "real_time_capable": analysis.get("real_time", False)
            },
            artifacts=analysis.get("config_files", [])
        )
    
    async def _comprehensive_protocol_analysis(
        self, 
        protocol_type: str, 
        use_case: Dict
    ) -> Dict:
        """Comprehensive protocol analysis and configuration"""
        
        if protocol_type.lower() == "opcua":
            return await self._analyze_opcua_implementation(use_case)
        elif protocol_type.lower() == "uadp":
            return await self._analyze_uadp_implementation(use_case)
        else:
            raise ValueError(f"Unsupported protocol type: {protocol_type}")
    
    async def _analyze_opcua_implementation(self, use_case: Dict) -> Dict:
        """Analyze OPC UA implementation requirements"""
        
        config = {
            "protocol_selection": {
                "transport": "tcp",  # or "udp" for UADP
                "port": 4840,
                "security_mode": "SignAndEncrypt",
                "message_security": "Basic256Sha256"
            },
            "server_configuration": {
                "application_name": use_case.get("name", "OPC_UA_Server"),
                "application_uri": f"urn:example:opcua:{use_case.get('name', 'server')}",
                "product_uri": "https://example.com/opcua-server",
                "discovery_registration": True
            },
            "security_configuration": {
                "certificate_path": "/etc/opcua/certs/server.crt",
                "private_key_path": "/etc/opcua/private/server.key",
                "trusted_certificates": "/etc/opcua/trusted/",
                "rejected_certificates": "/etc/opcua/rejected/"
            }
        }
        
        # Generate configuration file
        config_file = Path(f"opcua-{use_case.get('name', 'server')}-config.yaml")
        with open(config_file, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        return {
            "transport": "tcp",
            "security_level": "high",
            "real_time": False,
            "config_files": [str(config_file)],
            "implementation": config
        }
    
    async def _analyze_uadp_implementation(self, use_case: Dict) -> Dict:
        """Analyze UADP implementation requirements"""
        
        config = {
            "uadp_configuration": {
                "transport_protocol": "udp_multicast",
                "multicast_address": "224.0.2.14",
                "port": 4840,
                "network_interface": "eth0"
            },
            "publisher_configuration": {
                "publisher_id": use_case.get("publisher_id", "Publisher1"),
                "publishing_interval": use_case.get("interval_ms", 1000),
                "writer_group_id": 1,
                "dataset_writer_id": 1
            },
            "discovery_configuration": {
                "announcement_interval": 60000,  # 60 seconds
                "probe_response_delay": "100-500ms",
                "multicast_discovery": True
            },
            "security_configuration": {
                "encryption_enabled": True,
                "signing_enabled": True,
                "key_management": "certificates"
            }
        }
        
        # Generate UADP configuration
        config_file = Path(f"uadp-{use_case.get('name', 'publisher')}-config.yaml")
        with open(config_file, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        return {
            "transport": "udp",
            "security_level": "high",
            "real_time": True,
            "config_files": [str(config_file)],
            "implementation": config
        }

class GitLabIntegrationHandler:
    """Handler for GitLab CI/CD pipeline integration"""
    
    async def create_integration_pipeline(
        self, 
        project_config: Dict[str, Any]
    ) -> TaskResult:
        """
        Create GitLab CI/CD pipeline with OpenAPI and industrial protocol support
        """
        task_id = f"gitlab_pipeline_{project_config.get('name', 'integration')}"
        
        pipeline_config = await self._generate_gitlab_ci_config(project_config)
        
        return TaskResult(
            task_id=task_id,
            task_type=TaskType.GITLAB_PIPELINE_INTEGRATION,
            status="completed",
            outputs=pipeline_config,
            metadata={
                "stages": len(pipeline_config.get("stages", [])),
                "security_scanning": True,
                "api_validation": True,
                "deployment_targets": len(pipeline_config.get("environments", []))
            },
            artifacts=[".gitlab-ci.yml", "ci/templates/*"]
        )
    
    async def _generate_gitlab_ci_config(self, project_config: Dict) -> Dict:
        """Generate comprehensive GitLab CI/CD configuration"""
        
        gitlab_ci = {
            "stages": [
                "validate",
                "build", 
                "test",
                "security",
                "deploy",
                "monitor"
            ],
            "variables": {
                "DOCKER_DRIVER": "overlay2",
                "DOCKER_TLS_CERTDIR": "/certs"
            },
            "include": [
                {"template": "Security/SAST.gitlab-ci.yml"},
                {"template": "Security/Container-Scanning.gitlab-ci.yml"},
                {"template": "Security/Dependency-Scanning.gitlab-ci.yml"}
            ]
        }
        
        # Add OpenAPI validation job
        gitlab_ci["openapi-validate"] = {
            "stage": "validate",
            "image": "node:18-alpine",
            "before_script": [
                "npm install -g @stoplight/spectral-cli"
            ],
            "script": [
                "spectral lint api/openapi.yaml --ruleset .spectral.yaml",
                "echo 'OpenAPI validation completed'"
            ],
            "artifacts": {
                "reports": {
                    "junit": "spectral-report.xml"
                },
                "paths": ["spectral-report.html"],
                "expire_in": "1 week"
            }
        }
        
        # Add industrial protocol testing
        if project_config.get("protocol_type") in ["opcua", "uadp"]:
            gitlab_ci["protocol-test"] = {
                "stage": "test",
                "image": "python:3.9",
                "services": ["docker:20-dind"],
                "before_script": [
                    "pip install opcua pytest"
                ],
                "script": [
                    "python -m pytest tests/protocol/ -v",
                    "python scripts/protocol-integration-test.py"
                ]
            }
        
        # Save configuration
        config_path = Path(".gitlab-ci.yml")
        with open(config_path, 'w') as f:
            yaml.dump(gitlab_ci, f, default_flow_style=False)
        
        return {
            "config_file": str(config_path),
            "stages": gitlab_ci["stages"],
            "environments": ["staging", "production"]
        }

class ProjectAnalysisHandler:
    """Handler for comprehensive project analysis"""
    
    async def analyze_project(
        self, 
        project_url: str, 
        analysis_scope: List[str]
    ) -> TaskResult:
        """
        Analyze project repository for API specifications, protocols, and CI/CD
        """
        task_id = f"project_analysis_{urlparse(project_url).path.split('/')[-1]}"
        
        try:
            analysis_results = await self._comprehensive_project_analysis(
                project_url, 
                analysis_scope
            )
            
            return TaskResult(
                task_id=task_id,
                task_type=TaskType.PROJECT_ANALYSIS,
                status="completed", 
                outputs=analysis_results,
                metadata={
                    "repository_url": project_url,
                    "analysis_scope": analysis_scope,
                    "files_analyzed": analysis_results.get("files_count", 0),
                    "apis_found": len(analysis_results.get("api_specs", [])),
                    "protocols_detected": analysis_results.get("protocols", [])
                },
                artifacts=analysis_results.get("generated_files", [])
            )
            
        except Exception as e:
            return TaskResult(
                task_id=task_id,
                task_type=TaskType.PROJECT_ANALYSIS,
                status="failed",
                outputs={"error": str(e)},
                metadata={},
                artifacts=[]
            )
    
    async def _comprehensive_project_analysis(
        self, 
        project_url: str, 
        scope: List[str]
    ) -> Dict:
        """Perform comprehensive project analysis"""
        
        # Clone repository for analysis
        repo_name = urlparse(project_url).path.split('/')[-1]
        repo_path = Path(f"/tmp/{repo_name}")
        
        if repo_path.exists():
            import shutil
            shutil.rmtree(repo_path)
        
        repo = git.Repo.clone_from(project_url, repo_path)
        
        analysis = {
            "repository_info": {
                "name": repo_name,
                "url": project_url,
                "branch": repo.active_branch.name,
                "commit_count": len(list(repo.iter_commits()))
            },
            "api_specs": [],
            "protocols": [],
            "ci_cd_configs": [],
            "documentation": [],
            "files_count": 0
        }
        
        # Analyze files
        for root, dirs, files in repo_path.rglob("*"):
            if root.is_file():
                analysis["files_count"] += 1
                
                # Look for API specifications
                if root.suffix in ['.yaml', '.yml', '.json']:
                    if any(keyword in root.name.lower() for keyword in ['openapi', 'swagger', 'api']):
                        analysis["api_specs"].append(str(root))
                
                # Look for CI/CD configurations  
                if root.name in ['.gitlab-ci.yml', '.github', 'azure-pipelines.yml']:
                    analysis["ci_cd_configs"].append(str(root))
                
                # Look for documentation
                if root.suffix == '.md':
                    analysis["documentation"].append(str(root))
        
        return analysis

class TrainingDataHandler:
    """Handler for converting training data to JSON format"""
    
    async def convert_training_data(
        self, 
        source_directory: str
    ) -> TaskResult:
        """
        Convert training-data.md files to JSON format in appropriate folders
        """
        task_id = f"training_conversion_{Path(source_directory).name}"
        
        conversion_results = await self._process_training_files(source_directory)
        
        return TaskResult(
            task_id=task_id,
            task_type=TaskType.TRAINING_DATA_GENERATION,
            status="completed",
            outputs=conversion_results,
            metadata={
                "source_directory": source_directory,
                "files_processed": conversion_results.get("files_processed", 0),
                "json_files_created": len(conversion_results.get("json_files", [])),
                "schemas_generated": len(conversion_results.get("schemas", []))
            },
            artifacts=conversion_results.get("json_files", [])
        )
    
    async def _process_training_files(self, source_dir: str) -> Dict:
        """Process and convert training markdown files to JSON"""
        
        results = {
            "files_processed": 0,
            "json_files": [],
            "schemas": [],
            "errors": []
        }
        
        source_path = Path(source_dir)
        
        for md_file in source_path.rglob("training-data.md"):
            try:
                results["files_processed"] += 1
                
                # Read markdown content
                content = md_file.read_text()
                
                # Parse structured training data
                training_data = self._parse_training_markdown(content)
                
                # Create JSON file
                json_file = md_file.parent / "training-data.json"
                with open(json_file, 'w') as f:
                    json.dump(training_data, f, indent=2)
                
                results["json_files"].append(str(json_file))
                
                # Generate schema
                schema = self._generate_json_schema(training_data)
                schema_file = md_file.parent / "schema.json"
                with open(schema_file, 'w') as f:
                    json.dump(schema, f, indent=2)
                
                results["schemas"].append(str(schema_file))
                
            except Exception as e:
                results["errors"].append({
                    "file": str(md_file),
                    "error": str(e)
                })
        
        return results
    
    def _parse_training_markdown(self, content: str) -> Dict:
        """Parse structured training data from markdown"""
        
        # Simple parsing - in production would use more sophisticated parsing
        training_data = {
            "modules": [],
            "examples": [],
            "patterns": [],
            "metadata": {
                "generated_at": "2025-09-06",
                "format_version": "1.0.0"
            }
        }
        
        # Extract code blocks and examples
        import re
        
        code_blocks = re.findall(r'```(\w+)?\n(.*?)\n```', content, re.DOTALL)
        for lang, code in code_blocks:
            training_data["examples"].append({
                "language": lang or "text",
                "content": code.strip(),
                "type": "code_example"
            })
        
        return training_data
    
    def _generate_json_schema(self, data: Dict) -> Dict:
        """Generate JSON schema for training data"""
        
        schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "title": "Training Data Schema",
            "description": "Schema for OSSA agent training data",
            "properties": {
                "modules": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "examples": {
                    "type": "array", 
                    "items": {
                        "type": "object",
                        "properties": {
                            "language": {"type": "string"},
                            "content": {"type": "string"},
                            "type": {"type": "string"}
                        }
                    }
                },
                "patterns": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "metadata": {
                    "type": "object",
                    "properties": {
                        "generated_at": {"type": "string"},
                        "format_version": {"type": "string"}
                    }
                }
            },
            "required": ["modules", "examples", "metadata"]
        }
        
        return schema

# Main task orchestrator
class AgentArchitectOrchestrator:
    """Main orchestrator for agent-architect tasks"""
    
    def __init__(self):
        self.api_handler = APISpecificationHandler()
        self.protocol_handler = IndustrialProtocolHandler()
        self.gitlab_handler = GitLabIntegrationHandler()
        self.project_handler = ProjectAnalysisHandler()
        self.training_handler = TrainingDataHandler()
    
    async def execute_task(
        self, 
        task_type: TaskType, 
        parameters: Dict[str, Any]
    ) -> TaskResult:
        """Execute a task based on type and parameters"""
        
        if task_type == TaskType.API_SPECIFICATION_RESEARCH:
            return await self.api_handler.research_and_generate_spec(
                parameters["topic"],
                parameters["requirements"]
            )
        elif task_type == TaskType.INDUSTRIAL_PROTOCOL_ANALYSIS:
            return await self.protocol_handler.analyze_protocol(
                parameters["protocol_type"],
                parameters["use_case"]
            )
        elif task_type == TaskType.GITLAB_PIPELINE_INTEGRATION:
            return await self.gitlab_handler.create_integration_pipeline(
                parameters["project_config"]
            )
        elif task_type == TaskType.PROJECT_ANALYSIS:
            return await self.project_handler.analyze_project(
                parameters["project_url"],
                parameters["analysis_scope"]
            )
        elif task_type == TaskType.TRAINING_DATA_GENERATION:
            return await self.training_handler.convert_training_data(
                parameters["source_directory"]
            )
        else:
            raise ValueError(f"Unsupported task type: {task_type}")

# CLI interface for task execution
async def main():
    """CLI interface for agent-architect tasks"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python task-handlers.py <task_type> [parameters...]")
        return
    
    orchestrator = AgentArchitectOrchestrator()
    task_type_str = sys.argv[1]
    
    try:
        task_type = TaskType(task_type_str)
        
        # Parse parameters (simplified for demo)
        parameters = {}
        if task_type == TaskType.API_SPECIFICATION_RESEARCH:
            parameters = {
                "topic": sys.argv[2] if len(sys.argv) > 2 else "example_api",
                "requirements": {"entities": ["user", "product"], "operations": ["create", "read"]}
            }
        elif task_type == TaskType.TRAINING_DATA_GENERATION:
            parameters = {
                "source_directory": sys.argv[2] if len(sys.argv) > 2 else "./training-modules"
            }
        
        result = await orchestrator.execute_task(task_type, parameters)
        
        print(f"Task {result.task_id} completed with status: {result.status}")
        print(f"Outputs: {json.dumps(result.outputs, indent=2)}")
        print(f"Artifacts: {result.artifacts}")
        
    except ValueError as e:
        print(f"Invalid task type: {e}")
        print(f"Available task types: {[t.value for t in TaskType]}")

if __name__ == "__main__":
    asyncio.run(main())