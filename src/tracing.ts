import {
  initTracer,
  JaegerTracer,
  TracingConfig,
  TracingOptions,
} from 'jaeger-client';

// Parse environment variables with defaults suitable for development
const samplerTypeEnv = process.env.JAEGER_SAMPLER_TYPE;
const samplerType =
  samplerTypeEnv &&
  ['const', 'probabilistic', 'ratelimiting', 'remote'].includes(samplerTypeEnv)
    ? samplerTypeEnv
    : 'const';

const samplerParamEnv = process.env.JAEGER_SAMPLER_PARAM;
const parsedSamplerParam =
  samplerParamEnv === undefined ? 1 : Number(samplerParamEnv);
const samplerParam = Number.isFinite(parsedSamplerParam)
  ? parsedSamplerParam
  : 1;
const logSpans = process.env.JAEGER_LOG_SPANS === 'true'; // Default to false in prod usually

const config: TracingConfig = {
  serviceName: process.env.JAEGER_SERVICE_NAME ?? 'aegis-backend',
  sampler: {
    type: samplerType,
    param: samplerParam,
  },
  reporter: {
    logSpans: logSpans,
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
