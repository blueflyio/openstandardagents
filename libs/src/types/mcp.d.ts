// Type definitions for Model Context Protocol packages
// These are stub definitions until the official packages are available

declare module '@modelcontextprotocol/server' {
  export class Server {
    constructor(config: any);
    setRequestHandler(name: string, handler: (request: any) => Promise<any>): void;
  }
}

declare module '@modelcontextprotocol/transport-sse' {
  export class SSETransport {
    constructor(config: any);
  }
}

declare module 'express' {
  export interface Application {
    use(middleware: any): void;
  }
  function express(): Application;
  namespace express {
    export function json(): any;
  }
  export = express;
}

declare module 'cors' {
  export default function (): any;
}

declare module 'ws' {
  export class WebSocketServer {
    constructor(config: any);
  }
  export class WebSocket {
    static readonly OPEN: number;
    readyState: number;
    send(data: string): void;
  }
}
