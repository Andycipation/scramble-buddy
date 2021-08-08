declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string;
    TOKEN: string;
    REDIS_URL: string;
    // REDIS_TLS_URL: string; // not used
  }
}
