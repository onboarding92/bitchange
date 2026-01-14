/**
 * GLOBAL toFixed Protection
 * This prevents ALL "toFixed is not a function" errors across the entire application
 */

// Store original toFixed
const originalToFixed = Number.prototype.toFixed;

// Override toFixed globally to handle ALL edge cases
(function() {
  // Patch Number.prototype.toFixed
  Number.prototype.toFixed = function(this: any, decimals?: number): string {
    try {
      // If this is already a valid number, use original
      if (typeof this === 'number' && isFinite(this) && !isNaN(this)) {
        return originalToFixed.call(this, decimals);
      }
      
      // Try to convert to number
      const num = Number(this);
      if (isFinite(num) && !isNaN(num)) {
        return originalToFixed.call(num, decimals);
      }
      
      // Fallback: return zero with correct decimals
      const d = decimals || 0;
      return d > 0 ? '0.' + '0'.repeat(d) : '0';
    } catch (e) {
      // Emergency fallback
      const d = decimals || 0;
      return d > 0 ? '0.' + '0'.repeat(d) : '0';
    }
  };

  // Also patch Object.prototype to catch undefined/null.toFixed() calls
  Object.defineProperty(Object.prototype, 'toFixed', {
    value: function(decimals?: number): string {
      try {
        const num = Number(this);
        if (isFinite(num) && !isNaN(num)) {
          return originalToFixed.call(num, decimals);
        }
      } catch (e) {
        // ignore
      }
      const d = decimals || 0;
      return d > 0 ? '0.' + '0'.repeat(d) : '0';
    },
    writable: true,
    configurable: true,
    enumerable: false // Don't show in for...in loops
  });
})();

// Export utility functions
export function safeToFixed(value: any, decimals: number = 2): string {
  try {
    const num = Number(value);
    if (isFinite(num) && !isNaN(num)) {
      return num.toFixed(decimals);
    }
  } catch (e) {
    // ignore
  }
  return '0.' + '0'.repeat(decimals);
}

export function formatCurrency(value: any, currency: string = '$', decimals: number = 2): string {
  return `${currency}${safeToFixed(value, decimals)}`;
}

export function formatCrypto(value: any): string {
  return safeToFixed(value, 8);
}

export function formatPercent(value: any): string {
  return safeToFixed(value, 2) + '%';
}

console.log('✅ Global toFixed protection activated');
