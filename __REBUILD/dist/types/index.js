/**
 * OSSA Core Type Definitions
 * Types-first approach for the entire platform
 */
export var AgentType;
(function (AgentType) {
    AgentType["WORKER"] = "worker";
    AgentType["ORCHESTRATOR"] = "orchestrator";
    AgentType["GOVERNOR"] = "governor";
    AgentType["CRITIC"] = "critic";
    AgentType["JUDGE"] = "judge";
    AgentType["TRAINER"] = "trainer";
    AgentType["INTEGRATOR"] = "integrator";
})(AgentType || (AgentType = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["STARTING"] = "starting";
    AgentStatus["STOPPING"] = "stopping";
})(AgentStatus || (AgentStatus = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["SUCCESS"] = "success";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["TIMEOUT"] = "timeout";
})(TaskStatus || (TaskStatus = {}));
export var PolicyType;
(function (PolicyType) {
    PolicyType["SECURITY"] = "security";
    PolicyType["COMPLIANCE"] = "compliance";
    PolicyType["RESOURCE"] = "resource";
    PolicyType["QUALITY"] = "quality";
    PolicyType["PERFORMANCE"] = "performance";
})(PolicyType || (PolicyType = {}));
export var PolicyAction;
(function (PolicyAction) {
    PolicyAction["ALLOW"] = "allow";
    PolicyAction["DENY"] = "deny";
    PolicyAction["WARN"] = "warn";
    PolicyAction["AUDIT"] = "audit";
    PolicyAction["REMEDIATE"] = "remediate";
})(PolicyAction || (PolicyAction = {}));
export var EnforcementLevel;
(function (EnforcementLevel) {
    EnforcementLevel["MANDATORY"] = "mandatory";
    EnforcementLevel["RECOMMENDED"] = "recommended";
    EnforcementLevel["OPTIONAL"] = "optional";
})(EnforcementLevel || (EnforcementLevel = {}));
export var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "command";
    MessageType["EVENT"] = "event";
    MessageType["QUERY"] = "query";
    MessageType["RESPONSE"] = "response";
    MessageType["ERROR"] = "error";
})(MessageType || (MessageType = {}));
// Export all types
export * from './agents';
export * from './workflows';
export * from './policies';
//# sourceMappingURL=index.js.map