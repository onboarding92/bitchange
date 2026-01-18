import { logger } from './logger';
import { sendEmail } from '../email';

// Alert configuration
const ALERT_CONFIG = {
  enabled: process.env.ALERTS_ENABLED === 'true',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@bitchange.pro',
  errorThreshold: 10, // Number of errors before alerting
  timeWindow: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Track errors for rate limiting
const errorTracker = new Map<string, { count: number; firstSeen: number }>();

/**
 * Send alert email for critical errors
 */
async function sendErrorAlert(error: Error, context?: Record<string, any>) {
  if (!ALERT_CONFIG.enabled) {
    logger.debug('Alerting disabled, skipping email');
    return;
  }

  const subject = `🚨 Critical Error Alert - BitChange Pro`;
  const html = `
    <h2>Critical Error Detected</h2>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Error:</strong> ${error.message}</p>
    <pre>${error.stack}</pre>
    ${context ? `<h3>Context:</h3><pre>${JSON.stringify(context, null, 2)}</pre>` : ''}
    <hr>
    <p><small>This is an automated alert from BitChange Pro monitoring system.</small></p>
  `;

  try {
    await sendEmail({
      to: ALERT_CONFIG.adminEmail,
      subject,
      text: error.message,
      html,
    });
    logger.info('Error alert sent successfully', { to: ALERT_CONFIG.adminEmail });
  } catch (emailError) {
    logger.error('Failed to send error alert email', { error: emailError });
  }
}

/**
 * Send performance alert
 */
async function sendPerformanceAlert(metric: string, value: number, threshold: number) {
  if (!ALERT_CONFIG.enabled) {
    return;
  }

  const subject = `⚠️ Performance Alert - BitChange Pro`;
  const html = `
    <h2>Performance Threshold Exceeded</h2>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Metric:</strong> ${metric}</p>
    <p><strong>Current Value:</strong> ${value}</p>
    <p><strong>Threshold:</strong> ${threshold}</p>
    <hr>
    <p><small>This is an automated alert from BitChange Pro monitoring system.</small></p>
  `;

  try {
    await sendEmail({
      to: ALERT_CONFIG.adminEmail,
      subject,
      text: `${metric}: ${value} exceeds threshold ${threshold}`,
      html,
    });
    logger.info('Performance alert sent successfully', { metric, value });
  } catch (emailError) {
    logger.error('Failed to send performance alert email', { error: emailError });
  }
}

/**
 * Track and alert on error rate
 */
export function trackError(error: Error, context?: Record<string, any>) {
  const errorKey = error.message;
  const now = Date.now();

  // Get or create error tracking entry
  let tracker = errorTracker.get(errorKey);
  if (!tracker || now - tracker.firstSeen > ALERT_CONFIG.timeWindow) {
    tracker = { count: 0, firstSeen: now };
    errorTracker.set(errorKey, tracker);
  }

  tracker.count++;

  // Send alert if threshold exceeded
  if (tracker.count === ALERT_CONFIG.errorThreshold) {
    sendErrorAlert(error, {
      ...context,
      occurrences: tracker.count,
      timeWindow: `${ALERT_CONFIG.timeWindow / 1000}s`,
    });
  }

  // Clean up old entries
  if (errorTracker.size > 100) {
    const cutoff = now - ALERT_CONFIG.timeWindow;
    for (const [key, value] of Array.from(errorTracker.entries())) {
      if (value.firstSeen < cutoff) {
        errorTracker.delete(key);
      }
    }
  }
}

/**
 * Monitor memory usage and alert if high
 */
export function monitorMemoryUsage() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  logger.debug('Memory usage', {
    heapUsedMB: heapUsedMB.toFixed(2),
    heapTotalMB: heapTotalMB.toFixed(2),
    heapUsagePercent: heapUsagePercent.toFixed(2),
  });

  // Alert if heap usage exceeds 90%
  if (heapUsagePercent > 90) {
    sendPerformanceAlert('Memory Usage', heapUsagePercent, 90);
  }
}

/**
 * Start periodic monitoring
 */
export function startMonitoring() {
  // Monitor memory every 5 minutes
  setInterval(monitorMemoryUsage, 5 * 60 * 1000);
  
  logger.info('Monitoring started', {
    alertsEnabled: ALERT_CONFIG.enabled,
    adminEmail: ALERT_CONFIG.adminEmail,
  });
}

export { sendErrorAlert, sendPerformanceAlert };
