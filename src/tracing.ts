import {
  initTracer,
  JaegerTracer,
  TracingConfig,
  TracingOptions,
} from 'jaeger-client';

const config: TracingConfig = {
  serviceName: 'aegis-backend',
  sampler: {
    type: 'const',
    param: 1,
  },
  reporter: {
    logSpans: true,
    collectorEndpoint:
      process.env.JAEGER_ENDPOINT ?? 'http://jaeger:14268/api/traces',
  },
};

const options: TracingOptions = {
  logger: {
    info(msg: string) {
      console.log('JAEGER INFO', msg);
    },
    error(msg: string) {
      console.error('JAEGER ERROR', msg);
    },
  },
};

export const tracer: JaegerTracer = (
  initTracer as (c: TracingConfig, o: TracingOptions) => JaegerTracer
)(config, options);
