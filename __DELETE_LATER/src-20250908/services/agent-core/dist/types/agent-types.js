/**
 * OSSA Agent Type System
 * Defines the hierarchy and capabilities of different agent types
 */
/**
 * Agent Type Hierarchy
 */
export var AgentType;
(function (AgentType) {
    // Execution Agents
    AgentType["TASK"] = "task";
    AgentType["WORKFLOW"] = "workflow";
    AgentType["ORCHESTRATOR"] = "orchestrator";
    // Analysis Agents
    AgentType["RESEARCH"] = "research";
    AgentType["ANALYZER"] = "analyzer";
    AgentType["MONITOR"] = "monitor";
    // Transformation Agents
    AgentType["TRANSCRIBER"] = "transcriber";
    AgentType["TRANSLATOR"] = "translator";
    AgentType["GENERATOR"] = "generator";
    // Communication Agents
    AgentType["ROUTER"] = "router";
    AgentType["MESSENGER"] = "messenger";
    AgentType["NOTIFIER"] = "notifier";
    // Specialized Agents
    AgentType["SECURITY"] = "security";
    AgentType["VALIDATOR"] = "validator";
    AgentType["OPTIMIZER"] = "optimizer";
    // AI/ML Agents
    AgentType["CLASSIFIER"] = "classifier";
    AgentType["PREDICTOR"] = "predictor";
    AgentType["TRAINER"] = "trainer";
})(AgentType || (AgentType = {}));
//# sourceMappingURL=agent-types.js.map