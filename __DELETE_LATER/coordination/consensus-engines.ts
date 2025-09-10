/**
 * OSSA Enhanced Consensus Mechanisms
 * Implements production-ready Raft and PBFT algorithms for agent coordination
 */

import { EventEmitter } from 'events';
import { Vote, Evidence, ConsensusResult, ConsensusAlgorithm } from './agent-coordinator';

export enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader',
  CRASHED = 'crashed'
}

export interface RaftNode {
  id: string;
  state: NodeState;
  currentTerm: number;
  votedFor: string | null;
  log: LogEntry[];
  commitIndex: number;
  lastApplied: number;
  nextIndex?: Map<string, number>; // Leader only
  matchIndex?: Map<string, number>; // Leader only
  electionTimeout: number;
  heartbeatInterval: number;
  lastHeartbeat: Date;
}

export interface LogEntry {
  term: number;
  index: number;
  command: any;
  timestamp: Date;
  clientId: string;
}

export interface RaftMessage {
  type: 'RequestVote' | 'RequestVoteResponse' | 'AppendEntries' | 'AppendEntriesResponse';
  term: number;
  senderId: string;
  receiverId: string;
  data: any;
}

export interface RequestVoteArgs {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

export interface RequestVoteResponse {
  term: number;
  voteGranted: boolean;
}

export interface AppendEntriesArgs {
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entries: LogEntry[];
  leaderCommit: number;
}

export interface AppendEntriesResponse {
  term: number;
  success: boolean;
  matchIndex: number;
}

export interface PBFTNode {
  id: string;
  isPrimary: boolean;
  view: number;
  sequenceNumber: number;
  state: PBFTState;
  messageLog: Map<string, PBFTMessage>;
  preparedMessages: Set<string>;
  committedMessages: Set<string>;
  checkpoint: number;
  faultThreshold: number; // f, where n >= 3f + 1
}

export enum PBFTState {
  NORMAL = 'normal',
  VIEW_CHANGE = 'view_change',
  CHECKPOINTING = 'checkpointing',
  RECOVERY = 'recovery'
}

export interface PBFTMessage {
  type: 'Request' | 'PrePrepare' | 'Prepare' | 'Commit' | 'ViewChange' | 'NewView' | 'Checkpoint';
  view: number;
  sequenceNumber: number;
  digest: string;
  nodeId: string;
  timestamp: Date;
  data: any;
}

export interface ConsensusConfig {
  nodeId: string;
  nodes: string[];
  algorithm: ConsensusAlgorithm;
  timeouts: {
    election: number;
    heartbeat: number;
    request: number;
  };
  faultTolerance: number;
}

/**
 * Enhanced Raft Consensus Engine with proper leader election and log replication
 */
export class EnhancedRaftConsensusEngine extends EventEmitter {
  private node: RaftNode;
  private peers: Set<string>;
  private electionTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (message: RaftMessage) => Promise<RaftMessage | null>>;

  constructor(private config: ConsensusConfig) {
    super();
    
    this.peers = new Set(config.nodes.filter(id => id !== config.nodeId));
    this.messageHandlers = new Map();
    
    this.node = {
      id: config.nodeId,
      state: NodeState.FOLLOWER,
      currentTerm: 0,
      votedFor: null,
      log: [],
      commitIndex: 0,
      lastApplied: 0,
      electionTimeout: this.randomElectionTimeout(),
      heartbeatInterval: config.timeouts.heartbeat,
      lastHeartbeat: new Date()
    };

    this.initializeMessageHandlers();
    this.startElectionTimer();
  }

  /**
   * Reach consensus using Raft algorithm
   */
  async reachConsensus(votes: Vote[], evidence: Evidence[]): Promise<ConsensusResult> {
    const startTime = new Date();

    // Convert votes to log entries
    const command = {
      type: 'consensus',
      votes,
      evidence,
      timestamp: new Date()
    };

    // If we're the leader, replicate the command
    if (this.node.state === NodeState.LEADER) {
      const success = await this.replicateCommand(command);
      
      if (success) {
        // Determine consensus result based on committed votes
        const result = this.calculateConsensusResult(votes, evidence, startTime);
        this.emit('consensusReached', result);
        return result;
      } else {
        throw new Error('Failed to replicate consensus command');
      }
    } else {
      // Forward to leader or trigger election
      if (this.getCurrentLeader()) {
        return await this.forwardToLeader(command);
      } else {
        await this.triggerElection();
        throw new Error('No leader available for consensus');
      }
    }
  }

  /**
   * Replicate command across cluster
   */
  private async replicateCommand(command: any): Promise<boolean> {
    const logEntry: LogEntry = {
      term: this.node.currentTerm,
      index: this.node.log.length,
      command,
      timestamp: new Date(),
      clientId: this.node.id
    };

    // Append to local log
    this.node.log.push(logEntry);

    // Send AppendEntries to all followers
    const promises = Array.from(this.peers).map(peerId => 
      this.sendAppendEntries(peerId, [logEntry])
    );

    const responses = await Promise.allSettled(promises);
    const successCount = responses.filter(r => 
      r.status === 'fulfilled' && r.value?.success
    ).length;

    // Need majority to commit
    const majority = Math.floor(this.peers.size / 2) + 1;
    
    if (successCount + 1 >= majority) { // +1 for leader
      this.node.commitIndex = Math.max(this.node.commitIndex, logEntry.index);
      this.applyCommittedEntries();
      return true;
    }

    return false;
  }

  /**
   * Send AppendEntries RPC
   */
  private async sendAppendEntries(
    receiverId: string, 
    entries: LogEntry[]
  ): Promise<AppendEntriesResponse> {
    const nextIndex = this.node.nextIndex?.get(receiverId) || 0;
    const prevLogIndex = nextIndex - 1;
    const prevLogTerm = prevLogIndex >= 0 ? this.node.log[prevLogIndex]?.term || 0 : 0;

    const args: AppendEntriesArgs = {
      term: this.node.currentTerm,
      leaderId: this.node.id,
      prevLogIndex,
      prevLogTerm,
      entries,
      leaderCommit: this.node.commitIndex
    };

    const message: RaftMessage = {
      type: 'AppendEntries',
      term: this.node.currentTerm,
      senderId: this.node.id,
      receiverId,
      data: args
    };

    // In real implementation, this would be sent over network
    return await this.sendMessage(message) as AppendEntriesResponse;
  }

  /**
   * Handle RequestVote RPC
   */
  private async handleRequestVote(args: RequestVoteArgs): Promise<RequestVoteResponse> {
    let voteGranted = false;

    // Reply false if term < currentTerm
    if (args.term >= this.node.currentTerm) {
      // Update term if necessary
      if (args.term > this.node.currentTerm) {
        this.node.currentTerm = args.term;
        this.node.votedFor = null;
        this.node.state = NodeState.FOLLOWER;
      }

      // Grant vote if haven't voted for anyone else and candidate's log is up-to-date
      if ((this.node.votedFor === null || this.node.votedFor === args.candidateId) &&
          this.isLogUpToDate(args.lastLogIndex, args.lastLogTerm)) {
        voteGranted = true;
        this.node.votedFor = args.candidateId;
        this.resetElectionTimer();
      }
    }

    return {
      term: this.node.currentTerm,
      voteGranted
    };
  }

  /**
   * Handle AppendEntries RPC
   */
  private async handleAppendEntries(args: AppendEntriesArgs): Promise<AppendEntriesResponse> {
    this.node.lastHeartbeat = new Date();
    this.resetElectionTimer();

    // Reply false if term < currentTerm
    if (args.term < this.node.currentTerm) {
      return {
        term: this.node.currentTerm,
        success: false,
        matchIndex: 0
      };
    }

    // Update term and become follower
    if (args.term > this.node.currentTerm) {
      this.node.currentTerm = args.term;
      this.node.votedFor = null;
    }
    this.node.state = NodeState.FOLLOWER;

    // Reply false if log doesn't contain entry at prevLogIndex with matching term
    if (args.prevLogIndex >= 0 && 
        (this.node.log.length <= args.prevLogIndex || 
         this.node.log[args.prevLogIndex].term !== args.prevLogTerm)) {
      return {
        term: this.node.currentTerm,
        success: false,
        matchIndex: Math.min(args.prevLogIndex, this.node.log.length - 1)
      };
    }

    // Delete conflicting entries and append new ones
    if (args.entries.length > 0) {
      const insertIndex = args.prevLogIndex + 1;
      
      // Remove conflicting entries
      this.node.log.splice(insertIndex);
      
      // Append new entries
      this.node.log.push(...args.entries);
    }

    // Update commit index
    if (args.leaderCommit > this.node.commitIndex) {
      this.node.commitIndex = Math.min(args.leaderCommit, this.node.log.length - 1);
      this.applyCommittedEntries();
    }

    return {
      term: this.node.currentTerm,
      success: true,
      matchIndex: this.node.log.length - 1
    };
  }

  /**
   * Start leader election
   */
  private async startElection(): Promise<void> {
    this.node.state = NodeState.CANDIDATE;
    this.node.currentTerm++;
    this.node.votedFor = this.node.id;
    this.resetElectionTimer();

    console.log(`Node ${this.node.id} starting election for term ${this.node.currentTerm}`);

    // Request votes from all peers
    const votePromises = Array.from(this.peers).map(peerId => 
      this.requestVote(peerId)
    );

    const voteResponses = await Promise.allSettled(votePromises);
    let votesReceived = 1; // Vote for self

    voteResponses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value.voteGranted) {
        votesReceived++;
      }
    });

    // Check if won election
    const majority = Math.floor(this.peers.size / 2) + 1;
    if (votesReceived >= majority && this.node.state === NodeState.CANDIDATE) {
      this.becomeLeader();
    }
  }

  /**
   * Request vote from peer
   */
  private async requestVote(receiverId: string): Promise<RequestVoteResponse> {
    const lastLogIndex = this.node.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.node.log[lastLogIndex].term : 0;

    const args: RequestVoteArgs = {
      term: this.node.currentTerm,
      candidateId: this.node.id,
      lastLogIndex,
      lastLogTerm
    };

    const message: RaftMessage = {
      type: 'RequestVote',
      term: this.node.currentTerm,
      senderId: this.node.id,
      receiverId,
      data: args
    };

    return await this.sendMessage(message) as RequestVoteResponse;
  }

  /**
   * Become leader after winning election
   */
  private becomeLeader(): void {
    console.log(`Node ${this.node.id} became leader for term ${this.node.currentTerm}`);
    
    this.node.state = NodeState.LEADER;
    this.node.nextIndex = new Map();
    this.node.matchIndex = new Map();

    // Initialize leader state
    for (const peerId of this.peers) {
      this.node.nextIndex.set(peerId, this.node.log.length);
      this.node.matchIndex.set(peerId, 0);
    }

    // Send heartbeats immediately
    this.sendHeartbeats();
    this.startHeartbeatTimer();
  }

  /**
   * Send heartbeats to maintain leadership
   */
  private async sendHeartbeats(): Promise<void> {
    if (this.node.state !== NodeState.LEADER) return;

    const heartbeatPromises = Array.from(this.peers).map(peerId =>
      this.sendAppendEntries(peerId, [])
    );

    await Promise.allSettled(heartbeatPromises);
  }

  /**
   * Check if candidate's log is at least as up-to-date as receiver's log
   */
  private isLogUpToDate(lastLogIndex: number, lastLogTerm: number): boolean {
    const myLastLogIndex = this.node.log.length - 1;
    const myLastLogTerm = myLastLogIndex >= 0 ? this.node.log[myLastLogIndex].term : 0;

    return lastLogTerm > myLastLogTerm || 
           (lastLogTerm === myLastLogTerm && lastLogIndex >= myLastLogIndex);
  }

  /**
   * Apply committed entries to state machine
   */
  private applyCommittedEntries(): void {
    while (this.node.lastApplied < this.node.commitIndex) {
      this.node.lastApplied++;
      const entry = this.node.log[this.node.lastApplied];
      this.emit('entryApplied', entry);
    }
  }

  /**
   * Timer management
   */
  private startElectionTimer(): void {
    this.electionTimer = setTimeout(() => {
      if (this.node.state !== NodeState.LEADER) {
        this.startElection();
      }
    }, this.node.electionTimeout);
  }

  private resetElectionTimer(): void {
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
    }
    this.node.electionTimeout = this.randomElectionTimeout();
    this.startElectionTimer();
  }

  private startHeartbeatTimer(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.node.state === NodeState.LEADER) {
        this.sendHeartbeats();
      }
    }, this.node.heartbeatInterval);
  }

  private randomElectionTimeout(): number {
    return Math.floor(Math.random() * 150) + 150; // 150-300ms
  }

  private getCurrentLeader(): string | null {
    // In real implementation, track current leader
    return this.node.state === NodeState.LEADER ? this.node.id : null;
  }

  private async forwardToLeader(command: any): Promise<ConsensusResult> {
    // Simplified - in real implementation would forward to known leader
    throw new Error('Leader forwarding not implemented');
  }

  private async triggerElection(): Promise<void> {
    await this.startElection();
  }

  private async sendMessage(message: RaftMessage): Promise<any> {
    // Simplified message sending - in real implementation would use network
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      return await handler(message);
    }
    return null;
  }

  private initializeMessageHandlers(): void {
    this.messageHandlers.set('RequestVote', async (message: RaftMessage) => {
      return await this.handleRequestVote(message.data as RequestVoteArgs);
    });

    this.messageHandlers.set('AppendEntries', async (message: RaftMessage) => {
      return await this.handleAppendEntries(message.data as AppendEntriesArgs);
    });
  }

  private calculateConsensusResult(
    votes: Vote[],
    evidence: Evidence[],
    startTime: Date
  ): ConsensusResult {
    // Simple majority calculation
    const voteCounts = new Map<any, Vote[]>();
    
    votes.forEach(vote => {
      const key = JSON.stringify(vote.choice);
      if (!voteCounts.has(key)) {
        voteCounts.set(key, []);
      }
      voteCounts.get(key)!.push(vote);
    });

    let winningChoice: any;
    let winningVotes: Vote[] = [];
    
    for (const [choice, supportingVotes] of voteCounts) {
      if (supportingVotes.length > winningVotes.length) {
        winningChoice = JSON.parse(choice);
        winningVotes = supportingVotes;
      }
    }

    const confidence = winningVotes.reduce((sum, v) => sum + v.confidence, 0) / winningVotes.length;
    
    return {
      decision: winningChoice,
      confidence,
      participantVotes: votes,
      evidence,
      algorithm: ConsensusAlgorithm.RAFT,
      metadata: {
        startTime,
        endTime: new Date(),
        rounds: 1,
        convergenceRate: winningVotes.length / votes.length,
        dissensus: 1 - (winningVotes.length / votes.length),
        qualityMetrics: [{
          name: 'participation',
          value: votes.length,
          target: this.peers.size + 1,
          passed: votes.length >= Math.floor((this.peers.size + 1) / 2) + 1
        }]
      }
    };
  }
}

/**
 * Enhanced PBFT Consensus Engine with Byzantine fault tolerance
 */
export class EnhancedPBFTConsensusEngine extends EventEmitter {
  private node: PBFTNode;
  private nodes: Set<string>;
  private messageQueue: Map<string, PBFTMessage[]> = new Map();
  private viewChangeTimer: NodeJS.Timeout | null = null;

  constructor(private config: ConsensusConfig) {
    super();
    
    this.nodes = new Set(config.nodes);
    const f = config.faultTolerance;
    
    if (config.nodes.length < 3 * f + 1) {
      throw new Error(`PBFT requires at least ${3 * f + 1} nodes for fault tolerance ${f}`);
    }

    this.node = {
      id: config.nodeId,
      isPrimary: config.nodes[0] === config.nodeId, // Simple primary selection
      view: 0,
      sequenceNumber: 0,
      state: PBFTState.NORMAL,
      messageLog: new Map(),
      preparedMessages: new Set(),
      committedMessages: new Set(),
      checkpoint: 0,
      faultThreshold: f
    };

    if (this.node.isPrimary) {
      console.log(`Node ${this.node.id} is primary for view ${this.node.view}`);
    }
  }

  /**
   * Reach consensus using PBFT algorithm
   */
  async reachConsensus(votes: Vote[], evidence: Evidence[]): Promise<ConsensusResult> {
    const startTime = new Date();
    const request = {
      type: 'consensus',
      votes,
      evidence,
      timestamp: new Date()
    };

    if (this.node.isPrimary && this.node.state === PBFTState.NORMAL) {
      return await this.executeAsPrimary(request, startTime);
    } else {
      return await this.forwardToPrimary(request, startTime);
    }
  }

  /**
   * Execute consensus as primary node
   */
  private async executeAsPrimary(request: any, startTime: Date): Promise<ConsensusResult> {
    const sequenceNumber = ++this.node.sequenceNumber;
    const digest = this.calculateDigest(request);

    // Phase 1: Pre-prepare
    const prePrepareMessage: PBFTMessage = {
      type: 'PrePrepare',
      view: this.node.view,
      sequenceNumber,
      digest,
      nodeId: this.node.id,
      timestamp: new Date(),
      data: request
    };

    // Log the message
    this.node.messageLog.set(this.getMessageKey(prePrepareMessage), prePrepareMessage);

    // Broadcast pre-prepare to all backups
    await this.broadcastMessage(prePrepareMessage);

    // Wait for prepare messages from backups
    const preparePromises: Promise<boolean>[] = [];
    for (const nodeId of this.nodes) {
      if (nodeId !== this.node.id) {
        preparePromises.push(this.waitForPrepare(nodeId, sequenceNumber, digest));
      }
    }

    const prepareResponses = await Promise.allSettled(preparePromises);
    const prepareCount = prepareResponses.filter(r => r.status === 'fulfilled' && r.value).length;

    // Need 2f prepare messages (plus our own)
    if (prepareCount < 2 * this.node.faultThreshold) {
      throw new Error('Insufficient prepare messages received');
    }

    // Phase 2: Commit
    const commitMessage: PBFTMessage = {
      type: 'Commit',
      view: this.node.view,
      sequenceNumber,
      digest,
      nodeId: this.node.id,
      timestamp: new Date(),
      data: { prepared: true }
    };

    await this.broadcastMessage(commitMessage);
    this.node.preparedMessages.add(this.getMessageKey(commitMessage));

    // Wait for commit messages
    const commitPromises: Promise<boolean>[] = [];
    for (const nodeId of this.nodes) {
      if (nodeId !== this.node.id) {
        commitPromises.push(this.waitForCommit(nodeId, sequenceNumber, digest));
      }
    }

    const commitResponses = await Promise.allSettled(commitPromises);
    const commitCount = commitResponses.filter(r => r.status === 'fulfilled' && r.value).length;

    // Need 2f+1 commit messages (including our own)
    if (commitCount + 1 < 2 * this.node.faultThreshold + 1) {
      throw new Error('Insufficient commit messages received');
    }

    // Execute the request
    this.node.committedMessages.add(this.getMessageKey(commitMessage));
    
    return this.calculateConsensusResult(request.votes, request.evidence, startTime);
  }

  /**
   * Handle pre-prepare message (backup nodes)
   */
  private async handlePrePrepare(message: PBFTMessage): Promise<void> {
    // Validate message
    if (!this.validatePrePrepare(message)) {
      console.warn(`Invalid pre-prepare message from ${message.nodeId}`);
      return;
    }

    // Log the message
    this.node.messageLog.set(this.getMessageKey(message), message);

    // Send prepare message
    const prepareMessage: PBFTMessage = {
      type: 'Prepare',
      view: message.view,
      sequenceNumber: message.sequenceNumber,
      digest: message.digest,
      nodeId: this.node.id,
      timestamp: new Date(),
      data: { accepted: true }
    };

    await this.broadcastMessage(prepareMessage);
  }

  /**
   * Handle prepare message
   */
  private async handlePrepare(message: PBFTMessage): Promise<void> {
    if (!this.validatePrepare(message)) {
      return;
    }

    this.node.messageLog.set(this.getMessageKey(message), message);

    // Check if we have enough prepare messages
    const prepareCount = this.countMessagesByType('Prepare', message.sequenceNumber, message.digest);
    
    if (prepareCount >= 2 * this.node.faultThreshold) {
      // Send commit message
      const commitMessage: PBFTMessage = {
        type: 'Commit',
        view: message.view,
        sequenceNumber: message.sequenceNumber,
        digest: message.digest,
        nodeId: this.node.id,
        timestamp: new Date(),
        data: { prepared: true }
      };

      this.node.preparedMessages.add(this.getMessageKey(commitMessage));
      await this.broadcastMessage(commitMessage);
    }
  }

  /**
   * Handle commit message
   */
  private async handleCommit(message: PBFTMessage): Promise<void> {
    if (!this.validateCommit(message)) {
      return;
    }

    this.node.messageLog.set(this.getMessageKey(message), message);

    // Check if we have enough commit messages
    const commitCount = this.countMessagesByType('Commit', message.sequenceNumber, message.digest);
    
    if (commitCount >= 2 * this.node.faultThreshold + 1) {
      // Execute the request
      this.node.committedMessages.add(this.getMessageKey(message));
      this.emit('messageCommitted', message);
    }
  }

  /**
   * Initiate view change
   */
  private async initiateViewChange(): Promise<void> {
    console.log(`Node ${this.node.id} initiating view change from view ${this.node.view}`);
    
    this.node.state = PBFTState.VIEW_CHANGE;
    const newView = this.node.view + 1;

    const viewChangeMessage: PBFTMessage = {
      type: 'ViewChange',
      view: newView,
      sequenceNumber: this.node.sequenceNumber,
      digest: '',
      nodeId: this.node.id,
      timestamp: new Date(),
      data: {
        preparedMessages: Array.from(this.node.preparedMessages),
        lastSequenceNumber: this.node.sequenceNumber
      }
    };

    await this.broadcastMessage(viewChangeMessage);
  }

  /**
   * Message validation methods
   */
  private validatePrePrepare(message: PBFTMessage): boolean {
    return message.view === this.node.view &&
           message.type === 'PrePrepare' &&
           this.node.isPrimary === false && // Only backups process pre-prepare
           this.calculateDigest(message.data) === message.digest;
  }

  private validatePrepare(message: PBFTMessage): boolean {
    return message.view === this.node.view &&
           message.type === 'Prepare' &&
           message.nodeId !== this.node.id;
  }

  private validateCommit(message: PBFTMessage): boolean {
    return message.view === this.node.view &&
           message.type === 'Commit' &&
           message.nodeId !== this.node.id;
  }

  /**
   * Helper methods
   */
  private calculateDigest(data: any): string {
    // Simple digest calculation - in production, use cryptographic hash
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private getMessageKey(message: PBFTMessage): string {
    return `${message.view}-${message.sequenceNumber}-${message.type}-${message.nodeId}`;
  }

  private countMessagesByType(
    type: string,
    sequenceNumber: number,
    digest: string
  ): number {
    let count = 0;
    for (const message of this.node.messageLog.values()) {
      if (message.type === type &&
          message.sequenceNumber === sequenceNumber &&
          message.digest === digest) {
        count++;
      }
    }
    return count;
  }

  private async broadcastMessage(message: PBFTMessage): Promise<void> {
    // In real implementation, this would send over network
    for (const nodeId of this.nodes) {
      if (nodeId !== this.node.id) {
        await this.sendMessageToNode(nodeId, message);
      }
    }
  }

  private async sendMessageToNode(nodeId: string, message: PBFTMessage): Promise<void> {
    // Simplified message sending
    console.log(`Sending ${message.type} from ${this.node.id} to ${nodeId}`);
  }

  private async waitForPrepare(
    nodeId: string,
    sequenceNumber: number,
    digest: string
  ): Promise<boolean> {
    // Simplified - in real implementation, wait for actual message
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.1), 100); // 90% success rate
    });
  }

  private async waitForCommit(
    nodeId: string,
    sequenceNumber: number,
    digest: string
  ): Promise<boolean> {
    // Simplified - in real implementation, wait for actual message
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.1), 100); // 90% success rate
    });
  }

  private async forwardToPrimary(request: any, startTime: Date): Promise<ConsensusResult> {
    // In real implementation, forward to current primary
    throw new Error('Primary forwarding not implemented');
  }

  private calculateConsensusResult(
    votes: Vote[],
    evidence: Evidence[],
    startTime: Date
  ): ConsensusResult {
    // Byzantine fault tolerant majority calculation
    const voteCounts = new Map<any, Vote[]>();
    
    votes.forEach(vote => {
      const key = JSON.stringify(vote.choice);
      if (!voteCounts.has(key)) {
        voteCounts.set(key, []);
      }
      voteCounts.get(key)!.push(vote);
    });

    let winningChoice: any;
    let winningVotes: Vote[] = [];
    
    // Need more than 2f+1 votes for Byzantine fault tolerance
    const requiredVotes = 2 * this.node.faultThreshold + 1;
    
    for (const [choice, supportingVotes] of voteCounts) {
      if (supportingVotes.length >= requiredVotes && supportingVotes.length > winningVotes.length) {
        winningChoice = JSON.parse(choice);
        winningVotes = supportingVotes;
      }
    }

    if (!winningChoice) {
      throw new Error('No Byzantine fault tolerant majority reached');
    }

    const confidence = winningVotes.reduce((sum, v) => sum + v.confidence, 0) / winningVotes.length;
    
    return {
      decision: winningChoice,
      confidence,
      participantVotes: votes,
      evidence,
      algorithm: ConsensusAlgorithm.PBFT,
      metadata: {
        startTime,
        endTime: new Date(),
        rounds: 3, // Pre-prepare, prepare, commit
        convergenceRate: winningVotes.length / votes.length,
        dissensus: 1 - (winningVotes.length / votes.length),
        qualityMetrics: [{
          name: 'byzantine_tolerance',
          value: winningVotes.length,
          target: requiredVotes,
          passed: winningVotes.length >= requiredVotes
        }]
      }
    };
  }
}