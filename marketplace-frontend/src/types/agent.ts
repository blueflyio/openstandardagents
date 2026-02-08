export interface Agent {
  gaid: string;
  name: string;
  description: string;
  version: string;
  icon?: string;
  trustLevel: TrustLevel;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  capabilities: string[];
  domains: string[];
  platforms: PlatformSupport[];
  readme?: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

export type TrustLevel = 'verified' | 'trusted' | 'unverified' | 'experimental';

export interface PlatformSupport {
  name: string;
  version?: string;
  deployment: 'kubernetes' | 'docker' | 'serverless' | 'edge';
}

export interface AgentFilter {
  search?: string;
  trustLevels?: TrustLevel[];
  domains?: string[];
  platforms?: string[];
  minRating?: number;
  tags?: string[];
}

export interface AgentReview {
  id: string;
  agentGaid: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
}

export interface DeploymentInstruction {
  platform: string;
  steps: string[];
  requirements: string[];
  configuration?: Record<string, any>;
}

export interface UsageStatistics {
  totalDeployments: number;
  activeInstances: number;
  successRate: number;
  avgResponseTime: number;
  last30Days: {
    deployments: number;
    activeUsers: number;
  };
}
