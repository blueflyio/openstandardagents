# OPC UA & UADP Protocol Training Module

## OPC UA Pub/Sub with UADP (UDP/Ethernet)

### Protocol Stack Overview
- **Transport Layer**: UDP (port 4840), Ethernet (EtherType 0xB62C), DTLS (port 4843)
- **Message Layer**: UADP binary encoding with optional chunking
- **Security Layer**: AES-CTR encryption, configurable signing, X.509 certificates
- **Discovery Layer**: Multicast announcements, probe-response patterns

### UADP Message Types
```typescript
enum UADPMessageType {
  DISCOVERY_ANNOUNCEMENT = 0x00,
  DISCOVERY_PROBE = 0x01, 
  DISCOVERY_RESPONSE = 0x02,
  NETWORK_MESSAGE = 0x10,
  DATASET_MESSAGE = 0x20
}
```

### Discovery Protocol Implementation

#### Announcement Messages
- Sent periodically (configurable interval, typically 30s-300s)
- Sent on configuration change
- Multicast to 224.0.2.14 (IPv4) or FF02::1 (IPv6)
- Contains publisher capabilities and available DataSets

```yaml
# UADP Discovery Configuration
discovery:
  announcement:
    interval: 60s  # seconds
    on_change: true
    multicast:
      ipv4: "224.0.2.14"
      ipv6: "FF02::1"
      port: 4840
  probe_response:
    delay_range: "100-500ms"  # Random delay to avoid collisions
    cache_ttl: 300s
```

#### Probe/Response Pattern
```typescript
interface ProbeMessage {
  messageType: UADPMessageType.DISCOVERY_PROBE;
  requestedCapabilities: string[];
  publisherId?: string;  // Optional: specific publisher
}

interface ResponseMessage {
  messageType: UADPMessageType.DISCOVERY_RESPONSE;
  publisherId: string;
  capabilities: PublisherCapabilities;
  dataSetMetadata: DataSetMetaData[];
  responseDelay: number;  // 100-500ms random
}
```

### Network Message Structure

#### UADP NetworkMessage Header
```typescript
interface UADPNetworkMessageHeader {
  versionAndFlags: number;    // Version (4 bits) + Flags (4 bits)
  extendedFlags1?: number;    // Optional extended flags
  extendedFlags2?: number;    // Optional extended flags
  publisherId?: string | number; // Variable length
  dataSetClassId?: string;    // GUID
  groupHeader?: GroupHeader;
}

interface GroupHeader {
  groupFlags: number;
  writerGroupId: number;
  groupVersion: number;
  networkMessageNumber?: number;
  sequenceNumber?: number;
}
```

#### Chunking for Large Messages
```yaml
chunking:
  enabled: true
  mtu_size: 1472  # Ethernet MTU - headers
  max_chunks: 255
  reassembly_timeout: 5s
  compression: none  # or gzip, lz4
```

### DataSet Message Format

```typescript
interface DataSetMessage {
  dataSetFlags1: number;
  dataSetFlags2?: number;
  sequenceNumber?: number;
  timestamp?: Date;
  picoseconds?: number;
  deltaFrameData?: boolean;
  messageType: 'keyFrame' | 'deltaFrame' | 'keepAlive';
  payload: DataSetPayload;
}

interface DataSetPayload {
  dataSetWriterId: number;
  fieldCount?: number;
  fields: DataValue[];
}
```

### Security Implementation

#### Encryption Configuration
```yaml
security:
  mode: "SignAndEncrypt"  # None, Sign, SignAndEncrypt
  encryption:
    algorithm: "AES-CTR-128"
    key_management: "X509v3"
    certificate_store: "/etc/opcua/certs/"
  signing:
    algorithm: "HMAC-SHA256"
    key_derivation: "PBKDF2"
```

#### Certificate Management
```typescript
interface SecurityConfiguration {
  applicationCertificate: string;  // Path to cert
  privateKey: string;              // Path to private key
  trustedCertificates: string[];   // Trusted CA certs
  rejectedCertificates: string[];  // Explicitly rejected
  validationRules: {
    checkRevocation: boolean;
    allowSelfSigned: boolean;
    maxCertificateChainLength: number;
  };
}
```

### Quality of Service (QoS)

#### Network-Level QoS
```yaml
qos:
  dscp_marking: 46  # Expedited Forwarding
  vlan_priority: 7  # Network Control
  multicast_ttl: 64
  socket_priority: 6  # High priority
  bandwidth_reservation: "1Mbps"
```

#### Real-Time Performance
```typescript
interface RealTimeConfig {
  publishingInterval: number;     // microseconds
  maxLatency: number;            // microseconds  
  jitterTolerance: number;       // microseconds
  deterministicMode: boolean;
  cycleTime: number;             // for deterministic mode
  offsetTime: number;            // phase offset
}
```

### Transport Mapping Configurations

#### UDP Multicast
```yaml
transport:
  udp:
    multicast_groups:
      - address: "224.0.2.15"
        port: 4840
        interface: "eth0"
        ttl: 16
    socket_options:
      send_buffer: "64KB"
      recv_buffer: "64KB"
      reuse_address: true
```

#### Ethernet (Layer 2)
```yaml
transport:
  ethernet:
    interface: "eth0"
    ethertype: 0xB62C
    destination_mac: "01:00:5E:00:02:0F"  # Multicast
    vlan_id: 100
    priority: 7
```

#### MQTT Broker Integration
```yaml
transport:
  mqtt:
    broker_url: "mqtt://broker.example.com:1883"
    topic_template: "opcua/pub/{PublisherId}/{DataSetName}"
    qos: 2  # Exactly once delivery
    retain: false
    ssl:
      enabled: true
      ca_cert: "/path/to/ca.crt"
```

### Performance Optimization

#### Publisher-Side Optimization
```typescript
interface PublisherOptimization {
  batchingEnabled: boolean;
  batchSize: number;              // messages per batch
  batchTimeout: number;           // max wait time
  compressionEnabled: boolean;
  fieldFiltering: string[];       // only send changed fields
  deltaFrameEnabled: boolean;     // send only changes
}
```

#### Subscriber-Side Optimization  
```typescript
interface SubscriberOptimization {
  bufferSize: number;            // receive buffer size
  workerThreads: number;         // processing threads
  messageOrdering: boolean;      // preserve message order
  duplicateDetection: boolean;   // detect and filter duplicates
  lateDataHandling: 'drop' | 'queue' | 'process';
}
```

### Monitoring and Diagnostics

#### Key Performance Indicators
```yaml
monitoring:
  metrics:
    - message_rate_published
    - message_rate_received  
    - network_latency
    - processing_latency
    - error_rate
    - security_events
    - discovery_events
  collection_interval: 1s
  retention_period: 24h
```

#### Diagnostic Information Model
```typescript
interface DiagnosticCounters {
  sentMessages: number;
  receivedMessages: number;
  droppedMessages: number;
  encryptionErrors: number;
  networkErrors: number;
  securityViolations: number;
  discoveryTimeouts: number;
}
```

### Integration with Industrial Systems

#### PLC Integration Pattern
```yaml
plc_integration:
  protocol: "modbus_tcp"  # or "profinet", "ethercat"
  polling_interval: 10ms
  data_mapping:
    - plc_address: "DB1.DBW0"
      opcua_node: "ns=2;i=1001"
      scaling: 0.01
    - plc_address: "DB1.DBX2.0" 
      opcua_node: "ns=2;i=1002"
      type: "boolean"
```

#### SCADA Integration
```typescript
interface SCADAConnector {
  systemType: 'wonderware' | 'ignition' | 'wincc' | 'citect';
  connectionString: string;
  tagMappings: TagMapping[];
  alarmIntegration: boolean;
  historicalData: boolean;
}

interface TagMapping {
  scadaTag: string;
  opcuaNodeId: string;
  dataType: string;
  scalingFunction?: string;
  alarmLimits?: {
    high: number;
    low: number;
    hihi: number;
    lolo: number;
  };
}
```