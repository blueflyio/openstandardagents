/**
 * Human Collaboration Coordinator Server - THE MISSING LINK
 * Seamless human-AI workflow integration and stakeholder management
 */

import OSSAFastifyServer, { OSSAFastifyServerConfig } from '../services/fastify-server-template'
import { Type, Static } from '@sinclair/typebox'
import { FastifyRequest, FastifyReply } from 'fastify'

// Collaboration schemas
const StakeholderSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
  role: Type.String(),
  department: Type.Optional(Type.String()),
  expertise: Type.Array(Type.String()),
  communicationPreferences: Type.Object({
    preferredChannel: Type.Union([
      Type.Literal('email'),
      Type.Literal('slack'),
      Type.Literal('teams'),
      Type.Literal('direct'),
      Type.Literal('dashboard')
    ]),
    frequency: Type.Union([
      Type.Literal('realtime'),
      Type.Literal('hourly'),
      Type.Literal('daily'),
      Type.Literal('weekly')
    ]),
    detailLevel: Type.Union([
      Type.Literal('summary'),
      Type.Literal('detailed'),
      Type.Literal('comprehensive')
    ])
  }),
  availability: Type.Object({
    timezone: Type.String(),
    workingHours: Type.Object({
      start: Type.String(),
      end: Type.String()
    }),
    blockedTimes: Type.Optional(Type.Array(Type.String()))
  }),
  decisionAuthority: Type.Union([
    Type.Literal('observer'),
    Type.Literal('contributor'),
    Type.Literal('reviewer'),
    Type.Literal('approver'),
    Type.Literal('owner')
  ])
})

const MeetingSchema = Type.Object({
  meetingId: Type.String({ format: 'uuid' }),
  title: Type.String({ minLength: 5, maxLength: 200 }),
  purpose: Type.Union([
    Type.Literal('kickoff'),
    Type.Literal('status_review'),
    Type.Literal('decision_point'),
    Type.Literal('problem_solving'),
    Type.Literal('retrospective'),
    Type.Literal('planning')
  ]),
  participants: Type.Array(Type.String({ format: 'uuid' })),
  scheduledTime: Type.String({ format: 'date-time' }),
  estimatedDuration: Type.Number({ minimum: 15, maximum: 480 }), // minutes
  agenda: Type.Array(Type.Object({
    item: Type.String(),
    duration: Type.Number(),
    owner: Type.String(),
    decisionRequired: Type.Boolean()
  })),
  aiAssistance: Type.Object({
    transcriptionEnabled: Type.Boolean(),
    summaryGeneration: Type.Boolean(),
    actionItemTracking: Type.Boolean(),
    sentimentAnalysis: Type.Boolean()
  }),
  preparationMaterials: Type.Optional(Type.Array(Type.Object({
    title: Type.String(),
    url: Type.String(),
    required: Type.Boolean()
  })))
})

const FeedbackLoopSchema = Type.Object({
  loopId: Type.String({ format: 'uuid' }),
  workflowId: Type.String({ format: 'uuid' }),
  stakeholderId: Type.String({ format: 'uuid' }),
  feedbackType: Type.Union([
    Type.Literal('progress_update'),
    Type.Literal('quality_review'),
    Type.Literal('requirement_clarification'),
    Type.Literal('approval_request'),
    Type.Literal('escalation')
  ]),
  triggerConditions: Type.Array(Type.String()),
  responseRequired: Type.Boolean(),
  timeoutDuration: Type.Optional(Type.String()),
  escalationPath: Type.Optional(Type.Array(Type.String()))
})

const ConsensusRequestSchema = Type.Object({
  requestId: Type.String({ format: 'uuid' }),
  topic: Type.String({ minLength: 10, maxLength: 500 }),
  context: Type.String(),
  options: Type.Array(Type.Object({
    optionId: Type.String(),
    description: Type.String(),
    pros: Type.Array(Type.String()),
    cons: Type.Array(Type.String()),
    impact: Type.Object({
      effort: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')]),
      risk: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')]),
      value: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])
    })
  })),
  stakeholders: Type.Array(Type.String({ format: 'uuid' })),
  deadline: Type.String({ format: 'date-time' }),
  consensusThreshold: Type.Number({ minimum: 0.5, maximum: 1.0 }),
  allowPartialConsensus: Type.Boolean()
})

type Stakeholder = Static<typeof StakeholderSchema>
type Meeting = Static<typeof MeetingSchema>
type FeedbackLoop = Static<typeof FeedbackLoopSchema>
type ConsensusRequest = Static<typeof ConsensusRequestSchema>

class HumanCollaborationCoordinator extends OSSAFastifyServer {
  private stakeholders: Map<string, Stakeholder> = new Map()
  private activeFeedbackLoops: Map<string, FeedbackLoop> = new Map()
  private consensusRequests: Map<string, ConsensusRequest> = new Map()

  constructor() {
    const config: OSSAFastifyServerConfig = {
      host: '0.0.0.0',
      port: 8002,
      environment: 'development',
      agentName: 'human-collaboration-coordinator',
      ossaVersion: '0.1.8',
      openApiSpec: {},
      corsOrigins: ['*'],
      rateLimitMax: 100,
      rateLimitWindow: '1 minute'
    }
    
    super(config)
    this.setupCollaborationRoutes()
  }

  private setupCollaborationRoutes(): void {
    const fastify = this.getFastifyInstance()

    // Stakeholder management endpoints
    fastify.post('/stakeholders', {
      schema: {
        description: 'Register a new stakeholder',
        tags: ['Stakeholder Management'],
        body: StakeholderSchema,
        response: {
          201: Type.Object({
            stakeholderId: Type.String({ format: 'uuid' }),
            status: Type.Literal('registered'),
            integrationRecommendations: Type.Array(Type.String())
          })
        }
      }
    }, async (request: FastifyRequest<{ Body: Stakeholder }>, reply: FastifyReply) => {
      const stakeholder = request.body
      this.stakeholders.set(stakeholder.id, stakeholder)
      
      reply.code(201)
      return {
        stakeholderId: stakeholder.id,
        status: 'registered' as const,
        integrationRecommendations: this.generateIntegrationRecommendations(stakeholder)
      }
    })

    fastify.get('/stakeholders/:id/profile', {
      schema: {
        description: 'Get stakeholder collaboration profile',
        tags: ['Stakeholder Management'],
        params: Type.Object({
          id: Type.String({ format: 'uuid' })
        }),
        response: {
          200: Type.Object({
            stakeholder: StakeholderSchema,
            collaborationMetrics: Type.Object({
              engagementScore: Type.Number({ minimum: 0, maximum: 1 }),
              responseRate: Type.Number({ minimum: 0, maximum: 1 }),
              consensusAlignment: Type.Number({ minimum: 0, maximum: 1 }),
              preferredWorkingHours: Type.Array(Type.String())
            }),
            recommendedApproach: Type.Object({
              communicationStyle: Type.String(),
              meetingPreference: Type.String(),
              decisionMakingStyle: Type.String()
            })
          })
        }
      }
    }, async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const stakeholder = this.stakeholders.get(id)
      
      if (!stakeholder) {
        reply.code(404)
        return { error: 'Stakeholder not found' }
      }

      return {
        stakeholder,
        collaborationMetrics: this.calculateCollaborationMetrics(id),
        recommendedApproach: this.recommendCollaborationApproach(stakeholder)
      }
    })

    // Meeting orchestration endpoints
    fastify.post('/meetings', {
      schema: {
        description: 'Schedule and orchestrate a meeting',
        tags: ['Meeting Orchestration'],
        body: MeetingSchema,
        response: {
          201: Type.Object({
            meetingId: Type.String({ format: 'uuid' }),
            status: Type.Literal('scheduled'),
            optimizations: Type.Object({
              suggestedTimeAdjustments: Type.Optional(Type.Array(Type.String())),
              participantPreparations: Type.Array(Type.Object({
                stakeholderId: Type.String(),
                recommendations: Type.Array(Type.String())
              })),
              aiAssistanceSetup: Type.Object({
                transcriptionReady: Type.Boolean(),
                analysisEnabled: Type.Boolean()
              })
            })
          })
        }
      }
    }, async (request: FastifyRequest<{ Body: Meeting }>, reply: FastifyReply) => {
      const meeting = request.body
      
      reply.code(201)
      return {
        meetingId: meeting.meetingId,
        status: 'scheduled' as const,
        optimizations: {
          participantPreparations: this.generateParticipantPreparations(meeting),
          aiAssistanceSetup: {
            transcriptionReady: meeting.aiAssistance.transcriptionEnabled,
            analysisEnabled: meeting.aiAssistance.sentimentAnalysis
          }
        }
      }
    })

    fastify.get('/meetings/:id/live-assistance', {
      schema: {
        description: 'Get real-time meeting assistance',
        tags: ['Meeting Orchestration'],
        params: Type.Object({
          id: Type.String({ format: 'uuid' })
        }),
        response: {
          200: Type.Object({
            currentStatus: Type.Object({
              phase: Type.Union([
                Type.Literal('pre-meeting'),
                Type.Literal('in-progress'),
                Type.Literal('post-meeting')
              ]),
              currentAgendaItem: Type.Optional(Type.String()),
              timeRemaining: Type.Optional(Type.String())
            }),
            liveInsights: Type.Object({
              participationBalance: Type.Record(Type.String(), Type.Number()),
              sentimentTrend: Type.Array(Type.Object({
                timestamp: Type.String(),
                sentiment: Type.Number({ minimum: -1, maximum: 1 })
              })),
              keyTopicsDiscussed: Type.Array(Type.String()),
              decisionsIdentified: Type.Array(Type.String())
            }),
            suggestions: Type.Array(Type.Object({
              type: Type.Union([
                Type.Literal('time_management'),
                Type.Literal('participation_balance'),
                Type.Literal('decision_point'),
                Type.Literal('topic_drift')
              ]),
              message: Type.String(),
              urgency: Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])
            }))
          })
        }
      }
    }, async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      
      return {
        currentStatus: {
          phase: 'in-progress' as const,
          currentAgendaItem: 'Requirements Review',
          timeRemaining: '25 minutes'
        },
        liveInsights: {
          participationBalance: {
            'stakeholder-1': 0.4,
            'stakeholder-2': 0.3,
            'stakeholder-3': 0.3
          },
          sentimentTrend: [
            { timestamp: new Date().toISOString(), sentiment: 0.7 }
          ],
          keyTopicsDiscussed: ['budget constraints', 'timeline concerns', 'technical feasibility'],
          decisionsIdentified: ['Reduce initial scope', 'Extend timeline by 2 weeks']
        },
        suggestions: [
          {
            type: 'participation_balance' as const,
            message: 'Consider asking stakeholder-3 for input on the technical approach',
            urgency: 'medium' as const
          }
        ]
      }
    })

    // Feedback loop management
    fastify.post('/feedback-loops', {
      schema: {
        description: 'Establish a feedback loop',
        tags: ['Feedback Management'],
        body: FeedbackLoopSchema,
        response: {
          201: Type.Object({
            loopId: Type.String({ format: 'uuid' }),
            status: Type.Literal('active'),
            nextTrigger: Type.Optional(Type.String({ format: 'date-time' }))
          })
        }
      }
    }, async (request: FastifyRequest<{ Body: FeedbackLoop }>, reply: FastifyReply) => {
      const feedbackLoop = request.body
      this.activeFeedbackLoops.set(feedbackLoop.loopId, feedbackLoop)
      
      reply.code(201)
      return {
        loopId: feedbackLoop.loopId,
        status: 'active' as const,
        nextTrigger: this.calculateNextTrigger(feedbackLoop)
      }
    })

    fastify.post('/feedback-loops/:id/trigger', {
      schema: {
        description: 'Manually trigger a feedback loop',
        tags: ['Feedback Management'],
        params: Type.Object({
          id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
          context: Type.String(),
          priority: Type.Union([
            Type.Literal('low'),
            Type.Literal('normal'),
            Type.Literal('high'),
            Type.Literal('urgent')
          ])
        }),
        response: {
          200: Type.Object({
            triggered: Type.Boolean(),
            stakeholderNotified: Type.Boolean(),
            expectedResponse: Type.String({ format: 'date-time' })
          })
        }
      }
    }, async (request: FastifyRequest<{
      Params: { id: string }
      Body: { context: string; priority: 'low' | 'normal' | 'high' | 'urgent' }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const { context, priority } = request.body
      
      const feedbackLoop = this.activeFeedbackLoops.get(id)
      if (!feedbackLoop) {
        reply.code(404)
        return { error: 'Feedback loop not found' }
      }

      // Trigger the feedback loop
      const stakeholderNotified = await this.notifyStakeholder(feedbackLoop.stakeholderId, context, priority)
      
      return {
        triggered: true,
        stakeholderNotified,
        expectedResponse: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    })

    // Consensus building endpoints
    fastify.post('/consensus-requests', {
      schema: {
        description: 'Initiate a consensus building process',
        tags: ['Consensus Building'],
        body: ConsensusRequestSchema,
        response: {
          201: Type.Object({
            requestId: Type.String({ format: 'uuid' }),
            status: Type.Literal('active'),
            participantsNotified: Type.Number(),
            expectedCompletion: Type.String({ format: 'date-time' })
          })
        }
      }
    }, async (request: FastifyRequest<{ Body: ConsensusRequest }>, reply: FastifyReply) => {
      const consensusRequest = request.body
      this.consensusRequests.set(consensusRequest.requestId, consensusRequest)
      
      // Notify stakeholders
      const notificationCount = await this.notifyConsensusParticipants(consensusRequest)
      
      reply.code(201)
      return {
        requestId: consensusRequest.requestId,
        status: 'active' as const,
        participantsNotified: notificationCount,
        expectedCompletion: consensusRequest.deadline
      }
    })

    fastify.get('/consensus-requests/:id/status', {
      schema: {
        description: 'Get consensus building status',
        tags: ['Consensus Building'],
        params: Type.Object({
          id: Type.String({ format: 'uuid' })
        }),
        response: {
          200: Type.Object({
            requestId: Type.String({ format: 'uuid' }),
            progress: Type.Object({
              totalParticipants: Type.Number(),
              responsesReceived: Type.Number(),
              consensusScore: Type.Number({ minimum: 0, maximum: 1 }),
              timeRemaining: Type.String()
            }),
            responses: Type.Array(Type.Object({
              stakeholderId: Type.String(),
              optionId: Type.String(),
              confidence: Type.Number({ minimum: 0, maximum: 1 }),
              comments: Type.Optional(Type.String()),
              timestamp: Type.String({ format: 'date-time' })
            })),
            recommendations: Type.Object({
              leadingOption: Type.Optional(Type.String()),
              consensusAchievable: Type.Boolean(),
              suggestedActions: Type.Array(Type.String())
            })
          })
        }
      }
    }, async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const consensusRequest = this.consensusRequests.get(id)
      
      if (!consensusRequest) {
        reply.code(404)
        return { error: 'Consensus request not found' }
      }

      // Mock consensus tracking data
      return {
        requestId: id,
        progress: {
          totalParticipants: consensusRequest.stakeholders.length,
          responsesReceived: Math.floor(consensusRequest.stakeholders.length * 0.7),
          consensusScore: 0.82,
          timeRemaining: this.calculateTimeRemaining(consensusRequest.deadline)
        },
        responses: this.getMockConsensusResponses(consensusRequest),
        recommendations: {
          leadingOption: consensusRequest.options[0]?.optionId,
          consensusAchievable: true,
          suggestedActions: [
            'Schedule clarification session for remaining participants',
            'Consider hybrid approach combining top 2 options'
          ]
        }
      }
    })

    // Workflow integration endpoint
    fastify.post('/workflows/:id/human-integration', {
      schema: {
        description: 'Integrate human touchpoints into AI workflow',
        tags: ['Workflow Integration'],
        params: Type.Object({
          id: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
          touchpoints: Type.Array(Type.Object({
            stepId: Type.String(),
            humanRole: Type.Union([
              Type.Literal('reviewer'),
              Type.Literal('approver'),
              Type.Literal('contributor'),
              Type.Literal('observer')
            ]),
            stakeholderIds: Type.Array(Type.String()),
            triggerConditions: Type.Array(Type.String()),
            responseRequired: Type.Boolean(),
            timeoutAction: Type.Union([
              Type.Literal('continue'),
              Type.Literal('escalate'),
              Type.Literal('pause')
            ])
          }))
        }),
        response: {
          200: Type.Object({
            workflowId: Type.String({ format: 'uuid' }),
            integrationStatus: Type.Literal('configured'),
            touchpointsConfigured: Type.Number(),
            estimatedHumanInvolvement: Type.Object({
              totalTime: Type.String(),
              criticalPath: Type.Boolean(),
              stakeholdersInvolved: Type.Number()
            })
          })
        }
      }
    }, async (request: FastifyRequest<{
      Params: { id: string }
      Body: { touchpoints: any[] }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const { touchpoints } = request.body
      
      // Configure human touchpoints in workflow
      const humanInvolvement = this.calculateHumanInvolvement(touchpoints)
      
      return {
        workflowId: id,
        integrationStatus: 'configured' as const,
        touchpointsConfigured: touchpoints.length,
        estimatedHumanInvolvement: humanInvolvement
      }
    })
  }

  // Helper methods
  private generateIntegrationRecommendations(stakeholder: Stakeholder): string[] {
    const recommendations = []
    
    if (stakeholder.communicationPreferences.frequency === 'realtime') {
      recommendations.push('Enable instant notifications for critical updates')
    }
    
    if (stakeholder.decisionAuthority === 'approver') {
      recommendations.push('Set up automated approval workflows with escalation')
    }
    
    if (stakeholder.expertise.includes('technical')) {
      recommendations.push('Include in technical review cycles')
    }
    
    return recommendations
  }

  private calculateCollaborationMetrics(stakeholderId: string): object {
    // Mock metrics calculation
    return {
      engagementScore: 0.85,
      responseRate: 0.92,
      consensusAlignment: 0.78,
      preferredWorkingHours: ['09:00-12:00', '14:00-17:00']
    }
  }

  private recommendCollaborationApproach(stakeholder: Stakeholder): object {
    return {
      communicationStyle: stakeholder.communicationPreferences.detailLevel === 'summary' 
        ? 'executive_summary' 
        : 'detailed_analysis',
      meetingPreference: stakeholder.communicationPreferences.preferredChannel === 'direct' 
        ? 'face_to_face' 
        : 'virtual_structured',
      decisionMakingStyle: stakeholder.decisionAuthority === 'approver' 
        ? 'consensus_driven' 
        : 'consultative'
    }
  }

  private generateParticipantPreparations(meeting: Meeting): any[] {
    return meeting.participants.map(participantId => ({
      stakeholderId: participantId,
      recommendations: [
        'Review pre-meeting materials',
        'Prepare input on agenda items relevant to your expertise',
        'Consider time zones for optimal participation'
      ]
    }))
  }

  private calculateNextTrigger(feedbackLoop: FeedbackLoop): string | undefined {
    // Simple trigger calculation - would be more sophisticated in real implementation
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }

  private async notifyStakeholder(stakeholderId: string, context: string, priority: string): Promise<boolean> {
    // Mock notification - would integrate with actual notification systems
    console.log(`Notifying stakeholder ${stakeholderId}: ${context} (Priority: ${priority})`)
    return true
  }

  private async notifyConsensusParticipants(request: ConsensusRequest): Promise<number> {
    // Mock consensus notification
    console.log(`Notifying ${request.stakeholders.length} participants for consensus on: ${request.topic}`)
    return request.stakeholders.length
  }

  private calculateTimeRemaining(deadline: string): string {
    const now = new Date()
    const end = new Date(deadline)
    const diff = end.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  private getMockConsensusResponses(request: ConsensusRequest): any[] {
    return request.stakeholders.slice(0, 3).map(stakeholderId => ({
      stakeholderId,
      optionId: request.options[0]?.optionId || 'option-1',
      confidence: 0.8 + Math.random() * 0.2,
      comments: 'Looks good from my perspective',
      timestamp: new Date().toISOString()
    }))
  }

  private calculateHumanInvolvement(touchpoints: any[]): object {
    return {
      totalTime: `${touchpoints.length * 2}h`,
      criticalPath: touchpoints.some(tp => tp.responseRequired),
      stakeholdersInvolved: new Set(touchpoints.flatMap(tp => tp.stakeholderIds)).size
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const coordinator = new HumanCollaborationCoordinator()
  coordinator.start().catch(console.error)
}

export default HumanCollaborationCoordinator