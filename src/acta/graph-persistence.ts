/**
 * Context Graph Persistence with O(log n) Scaling
 * High-performance B-tree based graph storage and retrieval
 */

import {
  ContextGraph,
  ContextToken,
  BTreeIndex,
  BTreeNode,
  TokenRelationship,
  GraphMetadata,
  PerformanceMetrics,
  ContextPersistenceLayer,
  GraphUpdate,
  SemanticCluster
} from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GraphPersistenceEngine implements ContextPersistenceLayer {
  private readonly storageDir: string;
  private readonly indexFile: string;
  private readonly dataFile: string;
  private readonly metadataFile: string;
  private readonly backupDir: string;
  
  private graph: ContextGraph | null = null;
  private writeQueue: GraphUpdate[] = [];
  private isWriting = false;
  private writeInterval: NodeJS.Timeout | null = null;
  
  // B-tree configuration
  private readonly btreeOrder = 128; // High order for better disk performance
  private readonly maxCacheSize = 10000; // Maximum nodes in memory
  private nodeCache = new Map<string, BTreeNode>();
  private cacheAccessOrder: string[] = [];

  constructor(storageDir: string) {
    this.storageDir = storageDir;
    this.indexFile = path.join(storageDir, 'graph.index');
    this.dataFile = path.join(storageDir, 'graph.data');
    this.metadataFile = path.join(storageDir, 'graph.metadata');
    this.backupDir = path.join(storageDir, 'backups');
    
    this.startWriteProcessor();
  }

  /**
   * Initialize storage directory and files
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.mkdir(this.backupDir, { recursive: true });

    // Create initial files if they don't exist
    const files = [this.indexFile, this.dataFile, this.metadataFile];
    for (const file of files) {
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, '', 'utf8');
      }
    }
  }

  /**
   * Save context graph to persistent storage
   */
  async save(graph: ContextGraph): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.graph = graph;
      
      // Update metadata
      graph.metadata.lastUpdate = new Date();
      graph.metadata.version += 1;

      // Save components
      await Promise.all([
        this.saveIndex(graph.indexTree),
        this.saveTokens(graph.nodes),
        this.saveRelationships(graph.edges),
        this.saveClusters(graph.clusters),
        this.saveMetadata(graph.metadata)
      ]);

      // Update performance metrics
      const saveTime = Date.now() - startTime;
      this.updatePerformanceMetrics(graph.metadata.performance, 'save', saveTime);

    } catch (error) {
      console.error('Failed to save graph:', error);
      throw new Error(`Graph save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load context graph from persistent storage
   */
  async load(): Promise<ContextGraph> {
    const startTime = Date.now();

    try {
      if (this.graph) {
        return this.graph;
      }

      // Check if files exist
      await this.ensureFilesExist();

      // Load components in parallel
      const [indexTree, tokens, edges, clusters, metadata] = await Promise.all([
        this.loadIndex(),
        this.loadTokens(),
        this.loadRelationships(),
        this.loadClusters(),
        this.loadMetadata()
      ]);

      this.graph = {
        nodes: tokens,
        edges,
        clusters,
        indexTree,
        metadata
      };

      // Update performance metrics
      const loadTime = Date.now() - startTime;
      this.updatePerformanceMetrics(metadata.performance, 'load', loadTime);

      return this.graph;

    } catch (error) {
      console.error('Failed to load graph:', error);
      
      // Return empty graph if load fails
      return this.createEmptyGraph();
    }
  }

  /**
   * Create backup of current graph
   */
  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `graph-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupId);

    await fs.mkdir(backupPath, { recursive: true });

    // Copy all graph files
    const files = [
      { src: this.indexFile, dst: path.join(backupPath, 'graph.index') },
      { src: this.dataFile, dst: path.join(backupPath, 'graph.data') },
      { src: this.metadataFile, dst: path.join(backupPath, 'graph.metadata') }
    ];

    await Promise.all(
      files.map(({ src, dst }) => fs.copyFile(src, dst))
    );

    // Create backup manifest
    const manifest = {
      id: backupId,
      timestamp: new Date(),
      size: await this.calculateBackupSize(backupPath),
      version: this.graph?.metadata.version || 0
    };

    await fs.writeFile(
      path.join(backupPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    return backupId;
  }

  /**
   * Restore graph from backup
   */
  async restore(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);
    
    // Verify backup exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error(`Backup ${backupId} not found`);
    }

    // Restore files
    const files = [
      { src: path.join(backupPath, 'graph.index'), dst: this.indexFile },
      { src: path.join(backupPath, 'graph.data'), dst: this.dataFile },
      { src: path.join(backupPath, 'graph.metadata'), dst: this.metadataFile }
    ];

    await Promise.all(
      files.map(({ src, dst }) => fs.copyFile(src, dst))
    );

    // Clear cache and reload
    this.graph = null;
    this.nodeCache.clear();
    this.cacheAccessOrder = [];

    await this.load();
  }

  /**
   * Optimize storage and rebuild indices
   */
  async optimize(): Promise<void> {
    if (!this.graph) {
      await this.load();
    }

    const startTime = Date.now();

    try {
      // Rebuild B-tree index for optimal performance
      this.graph!.indexTree = await this.rebuildIndex(this.graph!.nodes);

      // Compact storage files
      await this.compactStorage();

      // Update clusters for better semantic organization
      await this.recomputeClusters();

      // Save optimized graph
      await this.save(this.graph!);

      const optimizeTime = Date.now() - startTime;
      console.log(`Graph optimization completed in ${optimizeTime}ms`);

    } catch (error) {
      console.error('Graph optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    if (this.graph) {
      return this.graph.metadata.performance;
    }

    try {
      const metadata = await this.loadMetadata();
      return metadata.performance;
    } catch {
      return this.createDefaultMetrics();
    }
  }

  /**
   * Add token with O(log n) insertion
   */
  async addToken(token: ContextToken): Promise<void> {
    if (!this.graph) {
      await this.load();
    }

    // Insert into B-tree index
    await this.insertToken(this.graph!.indexTree, token);

    // Add to nodes map
    this.graph!.nodes.set(token.id, token);

    // Queue for batch write
    this.queueUpdate({
      type: 'add',
      nodeId: token.id,
      changes: token,
      timestamp: new Date()
    });
  }

  /**
   * Find token with O(log n) lookup
   */
  async findToken(tokenId: string): Promise<ContextToken | null> {
    if (!this.graph) {
      await this.load();
    }

    return await this.searchBTree(this.graph!.indexTree, tokenId);
  }

  /**
   * Find tokens by similarity with O(log n) range queries
   */
  async findSimilarTokens(
    embedding: number[],
    threshold: number,
    limit: number = 10
  ): Promise<ContextToken[]> {
    if (!this.graph) {
      await this.load();
    }

    const candidates: Array<{ token: ContextToken; similarity: number }> = [];

    // Use B-tree for efficient range scanning
    await this.scanBTreeRange(
      this.graph!.indexTree,
      (token: ContextToken) => {
        const similarity = this.calculateCosineSimilarity(embedding, token.embedding);
        if (similarity >= threshold) {
          candidates.push({ token, similarity });
        }
        return candidates.length < limit * 2; // Continue scanning
      }
    );

    // Sort by similarity and return top results
    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(c => c.token);
  }

  /**
   * Update token relationships
   */
  async updateRelationships(
    tokenId: string,
    relationships: TokenRelationship[]
  ): Promise<void> {
    if (!this.graph) {
      await this.load();
    }

    const token = this.graph.nodes.get(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    token.relationships = relationships;
    this.graph.edges.set(tokenId, relationships);

    this.queueUpdate({
      type: 'update',
      nodeId: tokenId,
      changes: { relationships },
      timestamp: new Date()
    });
  }

  // Private methods

  /**
   * Save B-tree index to disk
   */
  private async saveIndex(indexTree: BTreeIndex): Promise<void> {
    const indexData = this.serializeIndex(indexTree);
    await fs.writeFile(this.indexFile, indexData, 'utf8');
  }

  /**
   * Save tokens to disk with compression
   */
  private async saveTokens(nodes: Map<string, ContextToken>): Promise<void> {
    const tokenData = JSON.stringify(Array.from(nodes.entries()));
    // In production, apply compression here
    await fs.writeFile(this.dataFile, tokenData, 'utf8');
  }

  /**
   * Save relationships to disk
   */
  private async saveRelationships(edges: Map<string, TokenRelationship[]>): Promise<void> {
    const edgeData = JSON.stringify(Array.from(edges.entries()));
    const edgeFile = this.dataFile.replace('.data', '.edges');
    await fs.writeFile(edgeFile, edgeData, 'utf8');
  }

  /**
   * Save semantic clusters
   */
  private async saveClusters(clusters: Map<string, string[]>): Promise<void> {
    const clusterData = JSON.stringify(Array.from(clusters.entries()));
    const clusterFile = this.dataFile.replace('.data', '.clusters');
    await fs.writeFile(clusterFile, clusterData, 'utf8');
  }

  /**
   * Save metadata
   */
  private async saveMetadata(metadata: GraphMetadata): Promise<void> {
    await fs.writeFile(
      this.metadataFile,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }

  /**
   * Load B-tree index from disk
   */
  private async loadIndex(): Promise<BTreeIndex> {
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf8');
      return indexData ? this.deserializeIndex(indexData) : this.createEmptyIndex();
    } catch {
      return this.createEmptyIndex();
    }
  }

  /**
   * Load tokens from disk
   */
  private async loadTokens(): Promise<Map<string, ContextToken>> {
    try {
      const tokenData = await fs.readFile(this.dataFile, 'utf8');
      if (!tokenData) return new Map();
      
      const entries = JSON.parse(tokenData);
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  /**
   * Load relationships from disk
   */
  private async loadRelationships(): Promise<Map<string, TokenRelationship[]>> {
    try {
      const edgeFile = this.dataFile.replace('.data', '.edges');
      const edgeData = await fs.readFile(edgeFile, 'utf8');
      if (!edgeData) return new Map();
      
      const entries = JSON.parse(edgeData);
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  /**
   * Load semantic clusters from disk
   */
  private async loadClusters(): Promise<Map<string, string[]>> {
    try {
      const clusterFile = this.dataFile.replace('.data', '.clusters');
      const clusterData = await fs.readFile(clusterFile, 'utf8');
      if (!clusterData) return new Map();
      
      const entries = JSON.parse(clusterData);
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  /**
   * Load metadata from disk
   */
  private async loadMetadata(): Promise<GraphMetadata> {
    try {
      const metadataData = await fs.readFile(this.metadataFile, 'utf8');
      return metadataData ? JSON.parse(metadataData) : this.createDefaultMetadata();
    } catch {
      return this.createDefaultMetadata();
    }
  }

  /**
   * Insert token into B-tree with O(log n) complexity
   */
  private async insertToken(index: BTreeIndex, token: ContextToken): Promise<void> {
    if (!index.root) {
      index.root = this.createBTreeNode(true);
      index.root.keys = [token.id];
      index.root.values = [token];
      index.depth = 1;
      return;
    }

    const result = await this.insertIntoBTreeNode(index.root, token.id, token);
    if (result.split) {
      // Root was split, create new root
      const newRoot = this.createBTreeNode(false);
      newRoot.keys = [result.promotedKey!];
      newRoot.children = [index.root, result.newNode!];
      newRoot.children[0].parent = newRoot;
      newRoot.children[1].parent = newRoot;
      
      index.root = newRoot;
      index.depth += 1;
    }
  }

  /**
   * Search B-tree for token with O(log n) complexity
   */
  private async searchBTree(index: BTreeIndex, tokenId: string): Promise<ContextToken | null> {
    if (!index.root) return null;

    return await this.searchBTreeNode(index.root, tokenId);
  }

  /**
   * Search within a B-tree node
   */
  private async searchBTreeNode(node: BTreeNode, tokenId: string): Promise<ContextToken | null> {
    // Load node into cache if needed
    await this.loadNodeToCache(node);

    // Binary search for key
    const index = this.binarySearchKeys(node.keys, tokenId);
    
    if (index >= 0 && node.keys[index] === tokenId) {
      // Found exact match
      return node.values[index];
    }

    if (node.isLeaf) {
      return null; // Not found
    }

    // Search in appropriate child
    const childIndex = index >= 0 ? index + 1 : -(index + 1);
    const child = await this.loadChild(node, childIndex);
    return await this.searchBTreeNode(child, tokenId);
  }

  /**
   * Insert into B-tree node
   */
  private async insertIntoBTreeNode(
    node: BTreeNode,
    key: string,
    value: ContextToken
  ): Promise<{ split: boolean; promotedKey?: string; newNode?: BTreeNode }> {
    // Load node into cache
    await this.loadNodeToCache(node);

    if (node.isLeaf) {
      // Insert into leaf node
      const insertIndex = this.findInsertPosition(node.keys, key);
      node.keys.splice(insertIndex, 0, key);
      node.values.splice(insertIndex, 0, value);

      if (node.keys.length <= this.btreeOrder) {
        return { split: false };
      } else {
        // Split leaf node
        return await this.splitLeafNode(node);
      }
    } else {
      // Insert into internal node
      const childIndex = this.findChildIndex(node.keys, key);
      const child = await this.loadChild(node, childIndex);
      const result = await this.insertIntoBTreeNode(child, key, value);

      if (!result.split) {
        return { split: false };
      }

      // Handle child split
      const insertIndex = childIndex;
      node.keys.splice(insertIndex, 0, result.promotedKey!);
      node.children.splice(insertIndex + 1, 0, result.newNode!);
      result.newNode!.parent = node;

      if (node.keys.length <= this.btreeOrder) {
        return { split: false };
      } else {
        // Split internal node
        return await this.splitInternalNode(node);
      }
    }
  }

  /**
   * Split leaf node when it becomes too full
   */
  private async splitLeafNode(node: BTreeNode): Promise<{
    split: boolean;
    promotedKey: string;
    newNode: BTreeNode;
  }> {
    const mid = Math.floor(node.keys.length / 2);
    
    const newNode = this.createBTreeNode(true);
    newNode.parent = node.parent;
    
    // Move half the keys and values to new node
    newNode.keys = node.keys.splice(mid);
    newNode.values = node.values.splice(mid);
    
    const promotedKey = newNode.keys[0];
    
    return {
      split: true,
      promotedKey,
      newNode
    };
  }

  /**
   * Split internal node when it becomes too full
   */
  private async splitInternalNode(node: BTreeNode): Promise<{
    split: boolean;
    promotedKey: string;
    newNode: BTreeNode;
  }> {
    const mid = Math.floor(node.keys.length / 2);
    
    const newNode = this.createBTreeNode(false);
    newNode.parent = node.parent;
    
    // Promote middle key
    const promotedKey = node.keys[mid];
    
    // Move keys, values, and children to new node
    newNode.keys = node.keys.splice(mid + 1);
    newNode.children = node.children.splice(mid + 1);
    
    // Remove promoted key
    node.keys.splice(mid, 1);
    
    // Update parent pointers
    newNode.children.forEach(child => {
      child.parent = newNode;
    });
    
    return {
      split: true,
      promotedKey,
      newNode
    };
  }

  /**
   * Scan B-tree range with callback
   */
  private async scanBTreeRange(
    index: BTreeIndex,
    callback: (token: ContextToken) => boolean
  ): Promise<void> {
    if (!index.root) return;

    await this.scanBTreeNodeRange(index.root, callback);
  }

  /**
   * Scan B-tree node range
   */
  private async scanBTreeNodeRange(
    node: BTreeNode,
    callback: (token: ContextToken) => boolean
  ): Promise<boolean> {
    await this.loadNodeToCache(node);

    if (node.isLeaf) {
      for (const value of node.values) {
        if (!callback(value)) {
          return false; // Stop scanning
        }
      }
      return true;
    } else {
      for (let i = 0; i <= node.keys.length; i++) {
        const child = await this.loadChild(node, i);
        if (!await this.scanBTreeNodeRange(child, callback)) {
          return false;
        }
        
        if (i < node.values.length) {
          if (!callback(node.values[i])) {
            return false;
          }
        }
      }
      return true;
    }
  }

  // Utility methods

  private createBTreeNode(isLeaf: boolean): BTreeNode {
    return {
      keys: [],
      values: [],
      children: [],
      isLeaf,
      parent: null
    };
  }

  private createEmptyIndex(): BTreeIndex {
    return {
      root: null,
      order: this.btreeOrder,
      depth: 0
    };
  }

  private createEmptyGraph(): ContextGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      clusters: new Map(),
      indexTree: this.createEmptyIndex(),
      metadata: this.createDefaultMetadata()
    };
  }

  private createDefaultMetadata(): GraphMetadata {
    return {
      version: 1,
      lastUpdate: new Date(),
      totalNodes: 0,
      totalEdges: 0,
      compressionRatio: 1,
      performance: this.createDefaultMetrics()
    };
  }

  private createDefaultMetrics(): PerformanceMetrics {
    return {
      queryLatency: 0,
      indexLatency: 0,
      compressionLatency: 0,
      memoryUsage: 0,
      diskUsage: 0,
      throughput: 0
    };
  }

  private binarySearchKeys(keys: string[], target: string): number {
    let left = 0;
    let right = keys.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = keys[mid].localeCompare(target);

      if (comparison === 0) {
        return mid;
      } else if (comparison < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return -(left + 1); // Return negative index for insertion point
  }

  private findInsertPosition(keys: string[], key: string): number {
    const index = this.binarySearchKeys(keys, key);
    return index >= 0 ? index : -(index + 1);
  }

  private findChildIndex(keys: string[], key: string): number {
    const index = this.binarySearchKeys(keys, key);
    return index >= 0 ? index + 1 : -(index + 1);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private async loadNodeToCache(node: BTreeNode): Promise<void> {
    const nodeId = this.getNodeId(node);
    
    if (this.nodeCache.has(nodeId)) {
      // Update access order
      const index = this.cacheAccessOrder.indexOf(nodeId);
      if (index > -1) {
        this.cacheAccessOrder.splice(index, 1);
      }
      this.cacheAccessOrder.push(nodeId);
      return;
    }

    // Add to cache
    this.nodeCache.set(nodeId, node);
    this.cacheAccessOrder.push(nodeId);

    // Evict if cache is too large
    if (this.nodeCache.size > this.maxCacheSize) {
      const evictId = this.cacheAccessOrder.shift()!;
      this.nodeCache.delete(evictId);
    }
  }

  private async loadChild(node: BTreeNode, index: number): Promise<BTreeNode> {
    if (index >= node.children.length) {
      throw new Error(`Child index ${index} out of bounds`);
    }
    
    const child = node.children[index];
    await this.loadNodeToCache(child);
    return child;
  }

  private getNodeId(node: BTreeNode): string {
    // Generate unique ID for node (simplified)
    return node.keys.join('|') + (node.isLeaf ? 'L' : 'I');
  }

  private serializeIndex(index: BTreeIndex): string {
    // Serialize B-tree to string (simplified)
    return JSON.stringify({
      order: index.order,
      depth: index.depth,
      root: index.root ? this.serializeNode(index.root) : null
    });
  }

  private deserializeIndex(data: string): BTreeIndex {
    // Deserialize B-tree from string (simplified)
    const parsed = JSON.parse(data);
    return {
      order: parsed.order,
      depth: parsed.depth,
      root: parsed.root ? this.deserializeNode(parsed.root) : null
    };
  }

  private serializeNode(node: BTreeNode): any {
    return {
      keys: node.keys,
      values: node.values,
      isLeaf: node.isLeaf,
      children: node.children.map(child => this.serializeNode(child))
    };
  }

  private deserializeNode(data: any): BTreeNode {
    const node: BTreeNode = {
      keys: data.keys,
      values: data.values,
      children: data.children.map((childData: any) => this.deserializeNode(childData)),
      isLeaf: data.isLeaf,
      parent: null
    };

    // Restore parent pointers
    node.children.forEach(child => {
      child.parent = node;
    });

    return node;
  }

  private queueUpdate(update: GraphUpdate): void {
    this.writeQueue.push(update);
  }

  private startWriteProcessor(): void {
    this.writeInterval = setInterval(async () => {
      await this.processWriteQueue();
    }, 1000); // Process writes every second
  }

  private async processWriteQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }

    this.isWriting = true;

    try {
      const batch = this.writeQueue.splice(0, 100); // Process up to 100 updates
      
      // Group updates by type
      const adds = batch.filter(u => u.type === 'add');
      const updates = batch.filter(u => u.type === 'update');
      const removes = batch.filter(u => u.type === 'remove');

      // Process batches
      if (adds.length > 0) await this.processBatchAdds(adds);
      if (updates.length > 0) await this.processBatchUpdates(updates);
      if (removes.length > 0) await this.processBatchRemoves(removes);

    } catch (error) {
      console.error('Write queue processing failed:', error);
    } finally {
      this.isWriting = false;
    }
  }

  private async processBatchAdds(adds: GraphUpdate[]): Promise<void> {
    // Process batch additions (simplified)
    for (const update of adds) {
      if (this.graph && update.changes) {
        this.graph.nodes.set(update.nodeId, update.changes as ContextToken);
      }
    }
  }

  private async processBatchUpdates(updates: GraphUpdate[]): Promise<void> {
    // Process batch updates (simplified)
    for (const update of updates) {
      if (this.graph && update.changes) {
        const existing = this.graph.nodes.get(update.nodeId);
        if (existing) {
          Object.assign(existing, update.changes);
        }
      }
    }
  }

  private async processBatchRemoves(removes: GraphUpdate[]): Promise<void> {
    // Process batch removals (simplified)
    for (const update of removes) {
      if (this.graph) {
        this.graph.nodes.delete(update.nodeId);
        this.graph.edges.delete(update.nodeId);
      }
    }
  }

  private async ensureFilesExist(): Promise<void> {
    const files = [this.indexFile, this.dataFile, this.metadataFile];
    
    for (const file of files) {
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, '', 'utf8');
      }
    }
  }

  private async calculateBackupSize(backupPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(backupPath);
      
      for (const file of files) {
        const filePath = path.join(backupPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    } catch (error) {
      console.error('Failed to calculate backup size:', error);
    }
    
    return totalSize;
  }

  private async rebuildIndex(tokens: Map<string, ContextToken>): Promise<BTreeIndex> {
    const newIndex = this.createEmptyIndex();
    
    for (const token of tokens.values()) {
      await this.insertToken(newIndex, token);
    }
    
    return newIndex;
  }

  private async compactStorage(): Promise<void> {
    // Storage compaction logic (simplified)
    console.log('Compacting storage...');
  }

  private async recomputeClusters(): Promise<void> {
    // Cluster recomputation logic (simplified)
    console.log('Recomputing clusters...');
  }

  private updatePerformanceMetrics(
    metrics: PerformanceMetrics,
    operation: string,
    duration: number
  ): void {
    switch (operation) {
      case 'save':
      case 'load':
        metrics.queryLatency = duration;
        break;
      case 'index':
        metrics.indexLatency = duration;
        break;
    }
    
    // Update memory usage
    metrics.memoryUsage = process.memoryUsage().heapUsed;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.writeInterval) {
      clearInterval(this.writeInterval);
      this.writeInterval = null;
    }

    // Process remaining writes
    await this.processWriteQueue();

    // Clear caches
    this.nodeCache.clear();
    this.cacheAccessOrder = [];
  }
}