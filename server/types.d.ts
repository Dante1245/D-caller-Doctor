declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string[] | undefined;
  }
}