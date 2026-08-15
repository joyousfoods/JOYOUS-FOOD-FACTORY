const stamp = () => new Date().toISOString();

const write = (level, scope, message, meta) => {
  const line = `${stamp()} [${level}] ${scope ? `(${scope}) ` : ''}${message}`;
  const stream = level === 'ERROR' || level === 'WARN' ? console.error : console.log;
  if (meta !== undefined) stream(line, meta);
  else stream(line);
};

export const logger = {
  info: (scope, message, meta) => write('INFO', scope, message, meta),
  warn: (scope, message, meta) => write('WARN', scope, message, meta),
  error: (scope, message, meta) => write('ERROR', scope, message, meta),
};
